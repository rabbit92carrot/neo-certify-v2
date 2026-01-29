/**
 * 폐기 서비스 — 병원 재고 폐기 (process_disposal RPC)
 */

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import type { ApiResponse } from '@/types/api.types';
import type { DisposalCreateData } from '@/schemas/treatment';
import type { Json } from '@/types/database.types';
import { createErrorResponse, createSuccessResponse, parseRpcSingle } from './common.service';

const logger = createLogger('disposal.service');

const DisposalResultSchema = z.object({
  disposal_id: z.string().uuid().nullable(),
  total_quantity: z.number(),
  error_code: z.string().nullable(),
  error_message: z.string().nullable(),
});

/**
 * 폐기 생성 (process_disposal RPC)
 */
export async function createDisposal(
  data: DisposalCreateData
): Promise<ApiResponse<{ disposalId: string; totalQuantity: number }>> {
  const supabase = await createClient();

  const items = data.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
  }));

  const { data: result, error } = await supabase.rpc('process_disposal', {
    p_disposal_date: data.disposalDate,
    p_disposal_reason_type: data.disposalReasonType,
    p_disposal_reason_custom: data.disposalReasonCustom ?? null,
    p_items: items as unknown as Json,
  });

  if (error) {
    logger.error('process_disposal 호출 실패', error);
    return createErrorResponse('DISPOSAL_CREATE_FAILED', '폐기 등록에 실패했습니다.');
  }

  const parsed = parseRpcSingle(DisposalResultSchema, result, 'process_disposal');
  if (!parsed.success) return createErrorResponse('VALIDATION_ERROR', parsed.error);

  const row = parsed.data;
  if (row?.error_code) {
    return createErrorResponse(row.error_code, row.error_message ?? '폐기 등록에 실패했습니다.');
  }

  if (!row?.disposal_id) {
    return createErrorResponse('DISPOSAL_CREATE_FAILED', '폐기 등록에 실패했습니다.');
  }

  return createSuccessResponse({
    disposalId: row.disposal_id,
    totalQuantity: row.total_quantity,
  });
}
