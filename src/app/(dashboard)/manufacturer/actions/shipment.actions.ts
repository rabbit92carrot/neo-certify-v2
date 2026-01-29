'use server';

/**
 * 제조사 출고 관련 Server Actions
 */

import { revalidatePath } from 'next/cache';
import { AuthService } from '@/services/auth.service';
import * as shipmentService from '@/services/shipment.service';
import * as inventoryService from '@/services/inventory.service';
import * as historyService from '@/services/history.service';
import { shipmentCreateSchema, recallSchema } from '@/schemas/shipment';
import type { ApiResponse } from '@/types/api.types';
import { formatZodErrors } from '@/lib/utils';
import { createErrorResponse } from '@/services/common.service';

async function requireManufacturer(): Promise<
  { orgId: string; orgType: 'MANUFACTURER' } | ApiResponse<never>
> {
  const user = await AuthService.getCurrentUser();
  if (!user.success || user.data!.organization.type !== 'MANUFACTURER') {
    return createErrorResponse('UNAUTHORIZED', '제조사 계정이 필요합니다.');
  }
  return { orgId: user.data!.organization.id, orgType: 'MANUFACTURER' };
}

function isError<T>(result: { orgId: string; orgType: string } | ApiResponse<T>): result is ApiResponse<T> {
  return 'success' in result && !result.success;
}

export async function createShipmentAction(
  data: { toOrganizationId: string; items: { productId: string; quantity: number }[] }
): Promise<ApiResponse<{ shipmentBatchId: string; totalQuantity: number }>> {
  const auth = await requireManufacturer();
  if (isError(auth)) return auth;

  const v = shipmentCreateSchema.safeParse(data);
  if (!v.success) return createErrorResponse('VALIDATION_ERROR', '입력값을 확인해주세요.', formatZodErrors(v.error));

  const result = await shipmentService.createShipment(v.data);
  if (result.success) {
    revalidatePath('/manufacturer/shipment');
    revalidatePath('/manufacturer/dashboard');
  }
  return result;
}

export async function recallShipmentAction(
  shipmentBatchId: string,
  reason: string
): Promise<ApiResponse<void>> {
  const auth = await requireManufacturer();
  if (isError(auth)) return auth;

  const v = recallSchema.safeParse({ shipmentBatchId, reason });
  if (!v.success) return createErrorResponse('VALIDATION_ERROR', '입력값을 확인해주세요.', formatZodErrors(v.error));

  const result = await shipmentService.recallShipment(v.data.shipmentBatchId, v.data.reason);
  if (result.success) revalidatePath('/manufacturer/shipment');
  return result;
}

export async function getShipmentTargetsAction() {
  const auth = await requireManufacturer();
  if (isError(auth)) return auth;
  return shipmentService.getShipmentTargetOrganizations(auth.orgType, auth.orgId);
}

export async function getAvailableProductsAction() {
  const auth = await requireManufacturer();
  if (isError(auth)) return auth;
  return inventoryService.getAvailableProductsForShipment(auth.orgId);
}

export async function getManufacturerHistoryAction(query?: historyService.HistoryCursorQuery) {
  const auth = await requireManufacturer();
  if (isError(auth)) return auth;
  return historyService.getManufacturerHistoryCursor(auth.orgId, query ?? {});
}
