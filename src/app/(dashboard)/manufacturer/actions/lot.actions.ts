'use server';

/**
 * 제조사 생산(Lot) 관련 Server Actions
 */

import { revalidatePath } from 'next/cache';
import { AuthService } from '@/services/auth.service';
import * as lotService from '@/services/lot.service';
import { lotCreateSchema } from '@/schemas/product';
import type { ApiResponse } from '@/types/api.types';
import { formatZodErrors } from '@/lib/utils';
import { createErrorResponse } from '@/services/common.service';

async function requireManufacturer(): Promise<string | ApiResponse<never>> {
  const user = await AuthService.getCurrentUser();
  if (!user.success || user.data!.organization.type !== 'MANUFACTURER') {
    return createErrorResponse('UNAUTHORIZED', '제조사 계정으로 로그인이 필요합니다.');
  }
  return user.data!.organization.id;
}

/**
 * Lot 생성 (생산 등록)
 */
export async function createLotAction(
  formData: FormData
): Promise<ApiResponse<{ lotId: string; totalQuantity: number }>> {
  const orgId = await requireManufacturer();
  if (typeof orgId !== 'string') return orgId;

  const raw = {
    productId: formData.get('productId') as string,
    lotNumber: formData.get('lotNumber') as string,
    quantity: parseInt(formData.get('quantity') as string, 10),
    manufactureDate: formData.get('manufactureDate') as string,
    expiryDate: formData.get('expiryDate') as string,
  };

  const v = lotCreateSchema.safeParse(raw);
  if (!v.success) return createErrorResponse('VALIDATION_ERROR', '입력값을 확인해주세요.', formatZodErrors(v.error));

  const result = await lotService.createLot(orgId, v.data);
  if (result.success) {
    revalidatePath('/manufacturer/production');
    revalidatePath('/manufacturer/dashboard');
  }
  return result;
}

/**
 * Lot에 수량 추가
 */
export async function addQuantityAction(
  lotId: string,
  additionalQuantity: number
): Promise<ApiResponse<{ totalQuantity: number }>> {
  const orgId = await requireManufacturer();
  if (typeof orgId !== 'string') return orgId;

  if (additionalQuantity <= 0) {
    return createErrorResponse('VALIDATION_ERROR', '추가 수량은 1 이상이어야 합니다.');
  }

  const result = await lotService.addQuantityToLot(orgId, lotId, additionalQuantity);
  if (result.success) revalidatePath('/manufacturer/production');
  return result;
}

/**
 * 제품별 Lot 목록 조회
 */
export async function getLotsAction(productId: string) {
  const orgId = await requireManufacturer();
  if (typeof orgId !== 'string') return orgId;
  return lotService.getLotsByProduct(orgId, productId);
}
