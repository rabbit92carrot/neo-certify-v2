'use server';

/**
 * 유통사 출고/입고/반품 Server Actions
 */

import { revalidatePath } from 'next/cache';
import { AuthService } from '@/services/auth.service';
import * as shipmentService from '@/services/shipment.service';
import * as inventoryService from '@/services/inventory.service';
import * as historyService from '@/services/history.service';
import { shipmentCreateSchema } from '@/schemas/shipment';
import type { ApiResponse } from '@/types/api.types';
import { formatZodErrors } from '@/lib/utils';
import { createErrorResponse } from '@/services/common.service';

async function requireDistributor(): Promise<
  { orgId: string; orgType: 'DISTRIBUTOR' } | ApiResponse<never>
> {
  const user = await AuthService.getCurrentUser();
  if (!user.success || user.data!.organization.type !== 'DISTRIBUTOR') {
    return createErrorResponse('UNAUTHORIZED', '유통사 계정이 필요합니다.');
  }
  return { orgId: user.data!.organization.id, orgType: 'DISTRIBUTOR' };
}

function isError<T>(result: { orgId: string; orgType: string } | ApiResponse<T>): result is ApiResponse<T> {
  return 'success' in result && !result.success;
}

/**
 * 유통사 재출고
 */
export async function createDistributorShipmentAction(
  data: { toOrganizationId: string; items: { productId: string; quantity: number }[] }
): Promise<ApiResponse<{ shipmentBatchId: string; totalQuantity: number }>> {
  const auth = await requireDistributor();
  if (isError(auth)) return auth;

  const v = shipmentCreateSchema.safeParse(data);
  if (!v.success) return createErrorResponse('VALIDATION_ERROR', '입력값 확인', formatZodErrors(v.error));

  const result = await shipmentService.createShipment(v.data);
  if (result.success) {
    revalidatePath('/distributor/shipment');
    revalidatePath('/distributor/dashboard');
  }
  return result;
}

/**
 * 반품 (수신자 주도)
 */
export async function returnShipmentAction(
  shipmentBatchId: string,
  reason: string,
  productQuantities?: { productId: string; quantity: number }[]
): Promise<ApiResponse<{ newBatchId: string | null; returnedCount: number }>> {
  const auth = await requireDistributor();
  if (isError(auth)) return auth;

  return shipmentService.returnShipment(shipmentBatchId, reason, productQuantities);
}

/**
 * 출고 대상 조직 조회
 */
export async function getDistributorShipmentTargetsAction() {
  const auth = await requireDistributor();
  if (isError(auth)) return auth;
  return shipmentService.getShipmentTargetOrganizations(auth.orgType, auth.orgId);
}

/**
 * 출고 가능 제품 조회
 */
export async function getDistributorAvailableProductsAction() {
  const auth = await requireDistributor();
  if (isError(auth)) return auth;
  return inventoryService.getAvailableProductsForShipment(auth.orgId);
}

/**
 * 재고 요약
 */
export async function getDistributorInventoryAction() {
  const auth = await requireDistributor();
  if (isError(auth)) return auth;
  return inventoryService.getInventorySummary(auth.orgId);
}

/**
 * 유통사 이력 조회
 */
export async function getDistributorHistoryAction(query?: historyService.HistoryCursorQuery) {
  const auth = await requireDistributor();
  if (isError(auth)) return auth;
  return historyService.getDistributorHistoryCursor(auth.orgId, query ?? {});
}
