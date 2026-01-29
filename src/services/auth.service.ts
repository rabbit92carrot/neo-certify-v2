/**
 * Auth Service
 * 인증 및 조직 정보 조회 서비스
 */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ApiResponse, CurrentUser, LoginResponse, Organization } from '@/types/api.types';

export class AuthService {
  /**
   * 현재 로그인된 사용자 + 조직 정보 조회
   */
  static async getCurrentUser(): Promise<ApiResponse<CurrentUser>> {
    try {
      const supabase = await createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return {
          success: false,
          error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' },
        };
      }

      // 조직 정보 조회
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (orgError || !organization) {
        return {
          success: false,
          error: { code: 'ORG_NOT_FOUND', message: '조직 정보를 찾을 수 없습니다' },
        };
      }

      // 제조사인 경우 설정 정보도 가져옴
      let manufacturerSettings;
      if (organization.type === 'MANUFACTURER') {
        const { data: settings } = await supabase
          .from('manufacturer_settings')
          .select('*')
          .eq('organization_id', organization.id)
          .single();
        manufacturerSettings = settings ?? undefined;
      }

      return {
        success: true,
        data: {
          id: user.id,
          email: user.email!,
          organization,
          manufacturerSettings,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
        },
      };
    }
  }

  /**
   * 이메일/비밀번호 로그인
   */
  static async login(
    email: string,
    password: string
  ): Promise<ApiResponse<LoginResponse>> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          error: {
            code: 'LOGIN_FAILED',
            message: '이메일 또는 비밀번호가 올바르지 않습니다',
          },
        };
      }

      // 조직 정보 조회
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .single();

      if (orgError || !organization) {
        return {
          success: false,
          error: { code: 'ORG_NOT_FOUND', message: '조직 정보를 찾을 수 없습니다' },
        };
      }

      // 승인 상태 확인
      if (organization.status !== 'ACTIVE') {
        await supabase.auth.signOut();
        const statusMessages: Record<string, string> = {
          PENDING_APPROVAL: '승인 대기 중인 계정입니다',
          SUSPENDED: '정지된 계정입니다',
          REJECTED: '승인이 거부된 계정입니다',
        };
        return {
          success: false,
          error: {
            code: 'ORG_NOT_ACTIVE',
            message: statusMessages[organization.status] ?? '로그인할 수 없는 계정 상태입니다',
          },
        };
      }

      return {
        success: true,
        data: {
          user: { id: data.user.id, email: data.user.email! },
          organization,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
        },
      };
    }
  }

  /**
   * 로그아웃
   */
  static async logout(): Promise<ApiResponse<void>> {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          success: false,
          error: { code: 'LOGOUT_FAILED', message: '로그아웃에 실패했습니다' },
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
        },
      };
    }
  }

  /**
   * 회원가입 (Admin 클라이언트로 사용자 생성)
   */
  static async register(
    email: string,
    password: string,
    orgData: Omit<Organization, 'id' | 'auth_user_id' | 'created_at' | 'updated_at' | 'status'>
  ): Promise<ApiResponse<{ userId: string; organizationId: string }>> {
    try {
      const adminClient = createAdminClient();

      // 1. Auth 사용자 생성
      const { data: authData, error: authError } =
        await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

      if (authError) {
        return {
          success: false,
          error: {
            code: 'REGISTRATION_FAILED',
            message: authError.message,
          },
        };
      }

      // 2. 조직 생성
      const { data: org, error: orgError } = await adminClient
        .from('organizations')
        .insert({
          ...orgData,
          email,
          auth_user_id: authData.user.id,
          status: 'PENDING_APPROVAL',
        })
        .select()
        .single();

      if (orgError) {
        // 롤백: auth 사용자 삭제
        await adminClient.auth.admin.deleteUser(authData.user.id);
        return {
          success: false,
          error: {
            code: 'ORG_CREATION_FAILED',
            message: orgError.message,
          },
        };
      }

      return {
        success: true,
        data: { userId: authData.user.id, organizationId: org.id },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
        },
      };
    }
  }

  /**
   * 현재 사용자의 조직 ID 조회 (빠른 헬퍼)
   */
  static async getOrganizationId(): Promise<string | null> {
    const result = await this.getCurrentUser();
    return result.success ? result.data!.organization.id : null;
  }

  /**
   * 현재 사용자의 조직 타입 조회 (빠른 헬퍼)
   */
  static async getOrganizationType(): Promise<string | null> {
    const result = await this.getCurrentUser();
    return result.success ? result.data!.organization.type : null;
  }
}
