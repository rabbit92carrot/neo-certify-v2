/**
 * User Service
 * 사용자 프로필 및 조직 정보 관리
 */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AuthService } from './auth.service';
import type { ApiResponse, Organization, OrgType, OrgStatus } from '@/types/api.types';

export class UserService {
  /**
   * 현재 사용자의 조직 프로필 조회
   */
  static async getProfile(): Promise<ApiResponse<Organization>> {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } };
      }

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (error || !data) {
        return { success: false, error: { code: 'NOT_FOUND', message: '조직 정보를 찾을 수 없습니다' } };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : '오류 발생' },
      };
    }
  }

  /**
   * 조직 프로필 업데이트
   */
  static async updateProfile(updates: {
    representative_name?: string;
    representative_phone?: string;
    address?: string;
  }): Promise<ApiResponse<Organization>> {
    try {
      const orgId = await AuthService.getOrganizationId();
      if (!orgId) {
        return { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } };
      }

      const supabase = await createClient();
      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', orgId)
        .select()
        .single();

      if (error) {
        return { success: false, error: { code: 'UPDATE_FAILED', message: error.message } };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : '오류 발생' },
      };
    }
  }

  /**
   * 조직 ID로 조직 정보 조회 (Admin용)
   */
  static async getOrganizationById(id: string): Promise<ApiResponse<Organization>> {
    try {
      const adminClient = createAdminClient();
      const { data, error } = await adminClient
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return { success: false, error: { code: 'NOT_FOUND', message: '조직을 찾을 수 없습니다' } };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : '오류 발생' },
      };
    }
  }

  /**
   * 조직 목록 조회 (Admin용)
   */
  static async listOrganizations(params?: {
    type?: OrgType;
    status?: OrgStatus;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<{ items: Organization[]; total: number }>> {
    try {
      const adminClient = createAdminClient();
      const page = params?.page ?? 1;
      const pageSize = params?.pageSize ?? 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = adminClient
        .from('organizations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (params?.type) query = query.eq('type', params.type);
      if (params?.status) query = query.eq('status', params.status);

      const { data, count, error } = await query;

      if (error) {
        return { success: false, error: { code: 'QUERY_FAILED', message: error.message } };
      }

      return {
        success: true,
        data: { items: data ?? [], total: count ?? 0 },
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : '오류 발생' },
      };
    }
  }

  /**
   * 타입별 조직 목록 (선택 드롭다운용)
   */
  static async getOrganizationsByType(
    type: OrgType
  ): Promise<ApiResponse<Pick<Organization, 'id' | 'name' | 'type'>[]>> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, type')
        .eq('type', type)
        .eq('status', 'ACTIVE')
        .order('name');

      if (error) {
        return { success: false, error: { code: 'QUERY_FAILED', message: error.message } };
      }

      return { success: true, data: data ?? [] };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : '오류 발생' },
      };
    }
  }
}
