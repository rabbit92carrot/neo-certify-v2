'use server';

/**
 * Admin 조직 관리 Server Actions
 */

import { revalidatePath } from 'next/cache';
import { AuthService } from '@/services/auth.service';
import * as orgService from '@/services/organization.service';
import type { ApiResponse, Organization, OrgType, OrgStatus, PaginatedResponse } from '@/types/api.types';
import { createErrorResponse } from '@/services/common.service';

async function requireAdmin(): Promise<true | ApiResponse<never>> {
  const user = await AuthService.getCurrentUser();
  if (!user.success || user.data!.organization.type !== 'ADMIN') {
    return createErrorResponse('UNAUTHORIZED', 'Admin 계정이 필요합니다.');
  }
  return true;
}

/**
 * 조직 목록 조회
 */
export async function listOrganizationsAction(params?: {
  type?: OrgType;
  status?: OrgStatus;
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<ApiResponse<PaginatedResponse<Organization>>> {
  const auth = await requireAdmin();
  if (auth !== true) return auth;
  return orgService.listOrganizations(params);
}

/**
 * 조직 승인
 */
export async function approveOrganizationAction(
  organizationId: string
): Promise<ApiResponse<Organization>> {
  const auth = await requireAdmin();
  if (auth !== true) return auth;

  const result = await orgService.approveOrganization(organizationId);
  if (result.success) revalidatePath('/admin/organizations');
  return result;
}

/**
 * 조직 거부
 */
export async function rejectOrganizationAction(
  organizationId: string,
  reason?: string
): Promise<ApiResponse<Organization>> {
  const auth = await requireAdmin();
  if (auth !== true) return auth;

  const result = await orgService.rejectOrganization(organizationId, reason);
  if (result.success) revalidatePath('/admin/organizations');
  return result;
}

/**
 * 조직 상태 변경
 */
export async function changeOrganizationStatusAction(
  organizationId: string,
  status: OrgStatus,
  reason?: string
): Promise<ApiResponse<Organization>> {
  const auth = await requireAdmin();
  if (auth !== true) return auth;

  const result = await orgService.changeOrganizationStatus(organizationId, status, reason);
  if (result.success) revalidatePath('/admin/organizations');
  return result;
}

/**
 * 조직 상세 조회
 */
export async function getOrganizationAction(
  organizationId: string
): Promise<ApiResponse<Organization>> {
  const auth = await requireAdmin();
  if (auth !== true) return auth;
  return orgService.getOrganizationById(organizationId);
}
