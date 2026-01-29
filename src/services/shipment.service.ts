/**
 * 출고 서비스 — FIFO 출고, 반품, 회수
 * v2: process_shipment, process_return, process_recall RPC 사용
 */

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import type { ApiResponse, Organization } from '@/types/api.types';
import type { ShipmentCreateData } from '@/schemas/shipment';
import type { Json } from '@/types/database.types';
import { createErrorResponse, createSuccessResponse, parseRpcSingle } from './common.service';

const logger = createLogger('shipment.service');

// ============================================================================
// RPC result schemas
// ============================================================================

const ShipmentResultSchema = z.object({
  shipment_batch_id: z.string().uuid().nullable(),
  total_quantity: z.number(),
  error_code: z.string().nullable(),
  error_message: z.string().nullable(),
});

const RecallResultSchema = z.object({
  success: z.boolean(),
  recalled_count: z.number(),
  error_code: z.string().nullable(),
  error_message: z.string().nullable(),
});

const ReturnResultSchema = z.object({
  success: z.boolean(),
  returned_count: z.number(),
  new_batch_id: z.string().uuid().nullable(),
  error_code: z.string().nullable(),
  error_message: z.string().nullable(),
});

// ============================================================================
// 출고 대상 조직 조회
// ============================================================================

type OrgType = 'MANUFACTURER' | 'DISTRIBUTOR' | 'HOSPITAL' | 'ADMIN';

function getTargetOrganizationTypes(orgType: OrgType): OrgType[] {
  if (orgType === 'MANUFACTURER' || orgType === 'DISTRIBUTOR') {
    return ['DISTRIBUTOR', 'HOSPITAL'];
  }
  return [];
}

export async function getShipmentTargetOrganizations(
  organizationType: OrgType,
  excludeOrganizationId?: string
): Promise<ApiResponse<Pick<Organization, 'id' | 'name' | 'type'>[]>> {
  const supabase = await createClient();
  const targetTypes = getTargetOrganizationTypes(organizationType);
  if (targetTypes.length === 0) return createSuccessResponse([]);

  let query = supabase
    .from('organizations')
    .select('id, name, type')
    .in('type', targetTypes)
    .eq('status', 'ACTIVE');
  if (excludeOrganizationId) query = query.neq('id', excludeOrganizationId);

  const { data, error } = await query.order('name');
  if (error) {
    logger.error('출고 대상 조직 조회 실패', error);
    return createErrorResponse('QUERY_ERROR', '출고 대상 조직 조회에 실패했습니다.');
  }
  return createSuccessResponse(data ?? []);
}

export async function searchShipmentTargetOrganizations(
  searchQuery: string,
  organizationType: OrgType,
  excludeOrganizationId?: string,
  limit = 20
): Promise<ApiResponse<Pick<Organization, 'id' | 'name' | 'type'>[]>> {
  const supabase = await createClient();
  const targetTypes = getTargetOrganizationTypes(organizationType);
  if (targetTypes.length === 0) return createSuccessResponse([]);

  let qb = supabase
    .from('organizations')
    .select('id, name, type')
    .in('type', targetTypes)
    .eq('status', 'ACTIVE')
    .ilike('name', `%${searchQuery}%`)
    .order('name')
    .limit(limit);
  if (excludeOrganizationId) qb = qb.neq('id', excludeOrganizationId);

  const { data, error } = await qb;
  if (error) return createErrorResponse('QUERY_ERROR', '조직 검색에 실패했습니다.');
  return createSuccessResponse(data ?? []);
}

// ============================================================================
// 출고 생성 (process_shipment RPC)
// ============================================================================

export async function createShipment(
  data: ShipmentCreateData
): Promise<ApiResponse<{ shipmentBatchId: string; totalQuantity: number }>> {
  const supabase = await createClient();

  // 수신 조직 타입 조회
  const { data: toOrg, error: toOrgErr } = await supabase
    .from('organizations')
    .select('type')
    .eq('id', data.toOrganizationId)
    .single();
  if (toOrgErr || !toOrg) {
    return createErrorResponse('ORGANIZATION_NOT_FOUND', '수신 조직을 찾을 수 없습니다.');
  }

  const items = data.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
  }));

  const { data: result, error } = await supabase.rpc('process_shipment', {
    p_to_org_id: data.toOrganizationId,
    p_to_org_type: toOrg.type,
    p_items: items as unknown as Json,
  });

  if (error) {
    logger.error('process_shipment 호출 실패', error);
    return createErrorResponse('SHIPMENT_CREATE_FAILED', '출고 생성에 실패했습니다.');
  }

  const parsed = parseRpcSingle(ShipmentResultSchema, result, 'process_shipment');
  if (!parsed.success) return createErrorResponse('VALIDATION_ERROR', parsed.error);

  const row = parsed.data;
  if (row?.error_code) {
    return createErrorResponse(row.error_code, row.error_message ?? '출고 생성에 실패했습니다.');
  }

  return createSuccessResponse({
    shipmentBatchId: row?.shipment_batch_id ?? '',
    totalQuantity: row?.total_quantity ?? 0,
  });
}

// ============================================================================
// 출고 회수 (process_recall — 발송자 주도, 24h 제한)
// ============================================================================

export async function recallShipment(
  shipmentBatchId: string,
  reason: string
): Promise<ApiResponse<void>> {
  const supabase = await createClient();

  const { data: result, error } = await supabase.rpc('process_recall', {
    p_shipment_batch_id: shipmentBatchId,
    p_reason: reason,
  });

  if (error) {
    logger.error('process_recall 호출 실패', error);
    return createErrorResponse('RECALL_FAILED', '출고 회수에 실패했습니다.');
  }

  const parsed = parseRpcSingle(RecallResultSchema, result, 'process_recall');
  if (!parsed.success) return createErrorResponse('VALIDATION_ERROR', parsed.error);

  const row = parsed.data;
  if (!row?.success) {
    return createErrorResponse(
      row?.error_code ?? 'RECALL_FAILED',
      row?.error_message ?? '출고 회수에 실패했습니다.'
    );
  }

  return createSuccessResponse(undefined);
}

// ============================================================================
// 출고 반품 (process_return — 수신자 주도, 시간 제한 없음)
// ============================================================================

export interface ReturnProductQuantity {
  productId: string;
  quantity: number;
}

export async function returnShipment(
  shipmentBatchId: string,
  reason: string,
  productQuantities?: ReturnProductQuantity[]
): Promise<ApiResponse<{ newBatchId: string | null; returnedCount: number }>> {
  const supabase = await createClient();

  const hasPartial = productQuantities && productQuantities.length > 0;

  const { data: result, error } = await supabase.rpc('process_return', {
    p_shipment_batch_id: shipmentBatchId,
    p_reason: reason,
    p_product_quantities: hasPartial ? (productQuantities as unknown as Json) : null,
  });

  if (error) {
    logger.error('process_return 호출 실패', error);
    return createErrorResponse('RETURN_FAILED', '출고 반품에 실패했습니다.');
  }

  const parsed = parseRpcSingle(ReturnResultSchema, result, 'process_return');
  if (!parsed.success) return createErrorResponse('VALIDATION_ERROR', parsed.error);

  const row = parsed.data;
  if (!row?.success) {
    return createErrorResponse(
      row?.error_code ?? 'RETURN_FAILED',
      row?.error_message ?? '출고 반품에 실패했습니다.'
    );
  }

  return createSuccessResponse({
    newBatchId: row.new_batch_id,
    returnedCount: row.returned_count,
  });
}

// ============================================================================
// 회수/반품 가능 여부 확인
// ============================================================================

export async function checkRecallAllowed(
  organizationId: string,
  shipmentBatchId: string
): Promise<ApiResponse<{ allowed: boolean; reason?: string }>> {
  const supabase = await createClient();
  const { data: batch, error } = await supabase
    .from('shipment_batches')
    .select('from_organization_id, is_recalled, shipment_date')
    .eq('id', shipmentBatchId)
    .single();
  if (error || !batch) return createErrorResponse('BATCH_NOT_FOUND', '출고 뭉치를 찾을 수 없습니다.');
  if (batch.from_organization_id !== organizationId)
    return createSuccessResponse({ allowed: false, reason: '발송자만 회수할 수 있습니다.' });
  if (batch.is_recalled)
    return createSuccessResponse({ allowed: false, reason: '이미 회수된 출고 뭉치입니다.' });

  const hoursDiff = (Date.now() - new Date(batch.shipment_date).getTime()) / (1000 * 60 * 60);
  if (hoursDiff > 24)
    return createSuccessResponse({ allowed: false, reason: '24시간 경과하여 처리할 수 없습니다.' });

  return createSuccessResponse({ allowed: true });
}

export async function checkReturnAllowed(
  organizationId: string,
  shipmentBatchId: string
): Promise<ApiResponse<{ allowed: boolean; reason?: string }>> {
  const supabase = await createClient();
  const { data: batch, error } = await supabase
    .from('shipment_batches')
    .select('to_organization_id, is_recalled')
    .eq('id', shipmentBatchId)
    .single();
  if (error || !batch) return createErrorResponse('BATCH_NOT_FOUND', '출고 뭉치를 찾을 수 없습니다.');
  if (batch.to_organization_id !== organizationId)
    return createSuccessResponse({ allowed: false, reason: '수신 조직만 반품할 수 있습니다.' });
  if (batch.is_recalled)
    return createSuccessResponse({ allowed: false, reason: '이미 반품된 출고 뭉치입니다.' });
  return createSuccessResponse({ allowed: true });
}
