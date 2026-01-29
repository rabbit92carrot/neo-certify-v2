/**
 * Lot 서비스 — 생산 등록 (Lot 생성 + 가상코드 생성)
 */

import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import type { ApiResponse, Lot } from '@/types/api.types';
import type { LotCreateData } from '@/schemas/product';
import { createErrorResponse, createSuccessResponse } from './common.service';

const logger = createLogger('lot.service');

/**
 * Lot 생성 + 가상코드 생성 (add_quantity_to_lot RPC)
 */
export async function createLot(
  organizationId: string,
  data: LotCreateData
): Promise<ApiResponse<{ lotId: string; totalQuantity: number }>> {
  const supabase = await createClient();

  // 제품 소유 확인
  const { data: product, error: productErr } = await supabase
    .from('products')
    .select('id')
    .eq('id', data.productId)
    .eq('organization_id', organizationId)
    .single();

  if (productErr || !product) {
    return createErrorResponse('PRODUCT_NOT_FOUND', '제품을 찾을 수 없습니다.');
  }

  // Lot 생성 (quantity=0으로 먼저 생성)
  const { data: lot, error: lotErr } = await supabase
    .from('lots')
    .insert({
      product_id: data.productId,
      lot_number: data.lotNumber,
      quantity: 0,
      manufacture_date: data.manufactureDate,
      expiry_date: data.expiryDate,
    })
    .select()
    .single();

  if (lotErr || !lot) {
    logger.error('Lot 생성 실패', lotErr);
    return createErrorResponse('LOT_CREATE_FAILED', 'Lot 생성에 실패했습니다.');
  }

  // 가상코드 생성 via RPC
  const { data: newQuantity, error: rpcErr } = await supabase.rpc('add_quantity_to_lot', {
    p_lot_id: lot.id,
    p_additional_quantity: data.quantity,
  });

  if (rpcErr) {
    logger.error('가상코드 생성 실패', rpcErr);
    return createErrorResponse('CODE_GEN_FAILED', '가상코드 생성에 실패했습니다.');
  }

  return createSuccessResponse({
    lotId: lot.id,
    totalQuantity: Number(newQuantity) || data.quantity,
  });
}

/**
 * Lot에 수량 추가 (추가 생산)
 */
export async function addQuantityToLot(
  organizationId: string,
  lotId: string,
  additionalQuantity: number
): Promise<ApiResponse<{ totalQuantity: number }>> {
  const supabase = await createClient();

  // 소유 확인
  const { data: lot } = await supabase
    .from('lots')
    .select('id, product:products!inner(organization_id)')
    .eq('id', lotId)
    .single();

  if (!lot) {
    return createErrorResponse('LOT_NOT_FOUND', 'Lot을 찾을 수 없습니다.');
  }

  const orgId = (lot.product as unknown as { organization_id: string }).organization_id;
  if (orgId !== organizationId) {
    return createErrorResponse('FORBIDDEN', '이 Lot에 대한 권한이 없습니다.');
  }

  const { data: newQuantity, error } = await supabase.rpc('add_quantity_to_lot', {
    p_lot_id: lotId,
    p_additional_quantity: additionalQuantity,
  });

  if (error) {
    logger.error('수량 추가 실패', error);
    return createErrorResponse('ADD_QUANTITY_FAILED', error.message);
  }

  return createSuccessResponse({ totalQuantity: newQuantity ?? 0 });
}

/**
 * 제품의 Lot 목록 조회
 */
export async function getLotsByProduct(
  organizationId: string,
  productId: string
): Promise<ApiResponse<Lot[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('lots')
    .select('*, product:products!inner(organization_id)')
    .eq('product_id', productId)
    .order('manufacture_date', { ascending: false });

  if (error) {
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  // Filter by org ownership
  const lots = (data ?? []).filter(
    (l) => (l.product as unknown as { organization_id: string }).organization_id === organizationId
  );

  // Strip the join
  const result: Lot[] = lots.map(({ product: _p, ...rest }) => rest as unknown as Lot);
  return createSuccessResponse(result);
}
