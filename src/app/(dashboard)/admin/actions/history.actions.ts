'use server';

/**
 * Admin 이력 조회 Server Actions
 */

import { AuthService } from '@/services/auth.service';
import * as historyService from '@/services/history.service';
import type { ApiResponse } from '@/types/api.types';
import { createErrorResponse } from '@/services/common.service';

async function requireAdmin(): Promise<true | ApiResponse<never>> {
  const user = await AuthService.getCurrentUser();
  if (!user.success || user.data!.organization.type !== 'ADMIN') {
    return createErrorResponse('UNAUTHORIZED', 'Admin 계정이 필요합니다.');
  }
  return true;
}

/**
 * Admin: 전체 이력 조회 (특정 조직의 이력)
 */
export async function getAdminHistoryAction(
  organizationId: string,
  query?: historyService.HistoryCursorQuery
): Promise<ApiResponse<historyService.CursorPaginatedHistory>> {
  const auth = await requireAdmin();
  if (auth !== true) return auth;
  return historyService.getTransactionHistoryCursor(organizationId, query ?? {});
}
