/**
 * 재고 서비스 — 조직별 재고 조회/관리
 * v2: owner_org_id 기반 쿼리
 */

import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import type { ApiResponse, Product } from '@/types/api.types';
import { createErrorResponse, createSuccessResponse } from './common.service';

const logger = createLogger('inventory.service');

// ============================================================================
// Types
// ============================================================================

export interface InventorySummary {
  productId: string;
  productName: string;
  modelName: string;
  udiDi: string;
  totalQuantity: number;
}

export interface InventoryByLot {
  lotId: string;
  lotNumber: string;
  manufactureDate: string;
  expiryDate: string;
  quantity: number;
}

export interface ProductInventoryDetail {
  product: Product;
  totalQuantity: number;
  byLot: InventoryByLot[];
}

// ============================================================================
// 재고 요약 (제품별)
// ============================================================================

/**
 * 조직의 제품별 재고 요약 조회
 * v2: owner_org_id 기반
 */
export async function getInventorySummary(
  organizationId: string
): Promise<ApiResponse<InventorySummary[]>> {
  const supabase = await createClient();

  // Direct query approach (no RPC dependency for now)
  const { data, error } = await supabase
    .from('virtual_codes')
    .select(`
      id,
      lot:lots!inner(
        product_id,
        product:products!inner(id, name, model_name, udi_di)
      )
    `)
    .eq('status', 'IN_STOCK')
    .eq('owner_org_id', organizationId)
    .is('owner_patient_id', null);

  if (error) {
    logger.error('재고 요약 조회 실패', error);
    return createErrorResponse('QUERY_ERROR', '재고 조회에 실패했습니다.');
  }

  // Aggregate by product
  const productMap = new Map<string, InventorySummary>();
  for (const row of data ?? []) {
    const lot = row.lot as unknown as {
      product_id: string;
      product: { id: string; name: string; model_name: string; udi_di: string };
    };
    const p = lot.product;
    const existing = productMap.get(p.id);
    if (existing) {
      existing.totalQuantity++;
    } else {
      productMap.set(p.id, {
        productId: p.id,
        productName: p.name,
        modelName: p.model_name ?? '',
        udiDi: p.udi_di ?? '',
        totalQuantity: 1,
      });
    }
  }

  return createSuccessResponse(Array.from(productMap.values()));
}

// ============================================================================
// 제품별 Lot 상세
// ============================================================================

export async function getProductInventoryDetail(
  organizationId: string,
  productId: string
): Promise<ApiResponse<ProductInventoryDetail>> {
  const supabase = await createClient();

  const [productResult, codesResult] = await Promise.all([
    supabase.from('products').select('*').eq('id', productId).single(),
    supabase
      .from('virtual_codes')
      .select(`
        id,
        lot:lots!inner(id, lot_number, manufacture_date, expiry_date, product_id)
      `)
      .eq('status', 'IN_STOCK')
      .eq('owner_org_id', organizationId)
      .is('owner_patient_id', null),
  ]);

  if (productResult.error || !productResult.data) {
    return createErrorResponse('PRODUCT_NOT_FOUND', '제품을 찾을 수 없습니다.');
  }

  if (codesResult.error) {
    logger.error('Lot별 재고 조회 실패', codesResult.error);
    return createErrorResponse('QUERY_ERROR', '재고 상세 조회에 실패했습니다.');
  }

  // Filter by product and aggregate by lot
  const lotMap = new Map<string, InventoryByLot>();
  for (const row of codesResult.data ?? []) {
    const lot = row.lot as unknown as {
      id: string;
      lot_number: string;
      manufacture_date: string;
      expiry_date: string;
      product_id: string;
    };
    if (lot.product_id !== productId) continue;
    const existing = lotMap.get(lot.id);
    if (existing) {
      existing.quantity++;
    } else {
      lotMap.set(lot.id, {
        lotId: lot.id,
        lotNumber: lot.lot_number,
        manufactureDate: lot.manufacture_date,
        expiryDate: lot.expiry_date ?? '',
        quantity: 1,
      });
    }
  }

  const byLot = Array.from(lotMap.values());
  const totalQuantity = byLot.reduce((sum, l) => sum + l.quantity, 0);

  return createSuccessResponse({
    product: productResult.data,
    totalQuantity,
    byLot,
  });
}

// ============================================================================
// 재고 카운트 (대시보드용)
// ============================================================================

export async function getTotalInventoryCount(organizationId: string): Promise<number> {
  const result = await getInventorySummary(organizationId);
  if (!result.success || !result.data) return 0;
  return result.data.reduce((sum, s) => sum + s.totalQuantity, 0);
}

/**
 * 출고 가능 제품 목록 (재고 > 0인 활성 제품)
 */
export async function getAvailableProductsForShipment(
  organizationId: string
): Promise<ApiResponse<(Product & { availableQuantity: number })[]>> {
  const supabase = await createClient();

  const summaryResult = await getInventorySummary(organizationId);
  if (!summaryResult.success) {
    return createErrorResponse(summaryResult.error!.code, summaryResult.error!.message);
  }

  const summaries = summaryResult.data ?? [];
  if (summaries.length === 0) return createSuccessResponse([]);

  const productIds = summaries.map((s) => s.productId);
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)
    .eq('is_active', true);

  if (error) {
    logger.error('제품 조회 실패', error);
    return createErrorResponse('QUERY_ERROR', '제품 조회에 실패했습니다.');
  }

  const quantityMap = new Map(summaries.map((s) => [s.productId, s.totalQuantity]));
  const result = (products ?? [])
    .map((p) => ({ ...p, availableQuantity: quantityMap.get(p.id) ?? 0 }))
    .filter((p) => p.availableQuantity > 0);

  return createSuccessResponse(result);
}
