'use server';

/**
 * 병원 폐기 Server Actions
 */

import { revalidatePath } from 'next/cache';
import { AuthService } from '@/services/auth.service';
import * as disposalService from '@/services/disposal.service';
import * as inventoryService from '@/services/inventory.service';
import { disposalCreateSchema } from '@/schemas/treatment';
import type { ApiResponse } from '@/types/api.types';
import { formatZodErrors } from '@/lib/utils';
import { createErrorResponse } from '@/services/common.service';

async function requireHospital(): Promise<string | ApiResponse<never>> {
  const user = await AuthService.getCurrentUser();
  if (!user.success || user.data!.organization.type !== 'HOSPITAL') {
    return createErrorResponse('UNAUTHORIZED', '병원 계정이 필요합니다.');
  }
  return user.data!.organization.id;
}

/**
 * 폐기 등록
 */
export async function createDisposalAction(
  data: {
    disposalDate: string;
    disposalReasonType: 'EXPIRED' | 'DAMAGED' | 'DEFECTIVE' | 'OTHER';
    disposalReasonCustom?: string;
    items: { productId: string; quantity: number }[];
  }
): Promise<ApiResponse<{ disposalId: string; totalQuantity: number }>> {
  const orgId = await requireHospital();
  if (typeof orgId !== 'string') return orgId;

  const v = disposalCreateSchema.safeParse(data);
  if (!v.success) return createErrorResponse('VALIDATION_ERROR', '입력값 확인', formatZodErrors(v.error));

  const result = await disposalService.createDisposal(v.data);
  if (result.success) {
    revalidatePath('/hospital/disposal');
    revalidatePath('/hospital/dashboard');
  }
  return result;
}

/**
 * 폐기 가능 재고 조회
 */
export async function getDisposalInventoryAction() {
  const orgId = await requireHospital();
  if (typeof orgId !== 'string') return orgId;
  return inventoryService.getAvailableProductsForShipment(orgId);
}
