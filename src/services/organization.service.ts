/**
 * 조직 관리 서비스 — Admin 승인/거부, 상태 변경
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';
import type { ApiResponse, Organization, OrgType, OrgStatus, PaginatedResponse } from '@/types/api.types';
import { createErrorResponse, createSuccessResponse, createNotFoundResponse } from './common.service';

const logger = createLogger('organization.service');

// ============================================================================
// Admin: 조직 목록
// ============================================================================

export async function listOrganizations(params?: {
  type?: OrgType;
  status?: OrgStatus;
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<ApiResponse<PaginatedResponse<Organization>>> {
  const adminClient = createAdminClient();
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  let qb = adminClient
    .from('organizations')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (params?.type) qb = qb.eq('type', params.type);
  if (params?.status) qb = qb.eq('status', params.status);
  if (params?.search) qb = qb.ilike('name', `%${params.search}%`);

  const { data, count, error } = await qb.range(offset, offset + pageSize - 1);
  if (error) {
    logger.error('조직 목록 조회 실패', error);
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  const total = count ?? 0;
  return createSuccessResponse({
    items: data ?? [],
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize), hasMore: offset + pageSize < total },
  });
}

// ============================================================================
// Admin: 조직 승인/거부
// ============================================================================

export async function approveOrganization(
  organizationId: string
): Promise<ApiResponse<Organization>> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('organizations')
    .update({ status: 'ACTIVE' })
    .eq('id', organizationId)
    .eq('status', 'PENDING_APPROVAL')
    .select()
    .single();

  if (error || !data) {
    return createErrorResponse('APPROVE_FAILED', '조직 승인에 실패했습니다.');
  }
  return createSuccessResponse(data);
}

export async function rejectOrganization(
  organizationId: string,
  _reason?: string
): Promise<ApiResponse<Organization>> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('organizations')
    .update({ status: 'REJECTED' })
    .eq('id', organizationId)
    .eq('status', 'PENDING_APPROVAL')
    .select()
    .single();

  if (error || !data) {
    return createErrorResponse('REJECT_FAILED', '조직 거부에 실패했습니다.');
  }
  return createSuccessResponse(data);
}

// ============================================================================
// Admin: 조직 상세 조회
// ============================================================================

export async function getOrganizationById(
  organizationId: string
): Promise<ApiResponse<Organization>> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single();

  if (error || !data) return createNotFoundResponse('조직을 찾을 수 없습니다.');
  return createSuccessResponse(data);
}

// ============================================================================
// Admin: 조직 상태 변경 (정지/활성화)
// ============================================================================

export async function changeOrganizationStatus(
  organizationId: string,
  status: OrgStatus,
  _reason?: string
): Promise<ApiResponse<Organization>> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('organizations')
    .update({ status })
    .eq('id', organizationId)
    .select()
    .single();

  if (error || !data) {
    return createErrorResponse('STATUS_CHANGE_FAILED', '상태 변경에 실패했습니다.');
  }
  return createSuccessResponse(data);
}

// ============================================================================
// 대기 중 조직 수 (대시보드)
// ============================================================================

export async function getPendingOrganizationCount(): Promise<number> {
  const adminClient = createAdminClient();
  const { count } = await adminClient
    .from('organizations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'PENDING_APPROVAL');
  return count ?? 0;
}
