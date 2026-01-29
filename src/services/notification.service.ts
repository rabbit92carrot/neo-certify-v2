/**
 * Notification Service
 * 알림 메시지 및 조직 알림 관리
 */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';
import { AuthService } from './auth.service';
import { sendNotification } from './alimtalk.service';
import { ALIMTALK_TEMPLATE_CODES, type AlimtalkTemplateCode } from '@/lib/aligo/templates';
import type { ApiResponse, NotificationMessage, OrganizationAlert } from '@/types/api.types';
import type { Json } from '@/types/database.types';

const logger = createLogger('notification.service');

// 알림톡 템플릿 코드 (레거시 호환 + 새 코드 매핑)
export const TEMPLATE_CODES = {
  TREATMENT_COMPLETE: 'TREATMENT_COMPLETE',
  RECALL_NOTICE: 'RECALL_NOTICE',
  ORG_APPROVED: 'ORG_APPROVED',
  ORG_REJECTED: 'ORG_REJECTED',
} as const;

export type TemplateCode = (typeof TEMPLATE_CODES)[keyof typeof TEMPLATE_CODES];

/** 내부 템플릿 코드 → Aligo 템플릿 코드 매핑 */
const TEMPLATE_CODE_MAP: Record<TemplateCode, AlimtalkTemplateCode> = {
  TREATMENT_COMPLETE: ALIMTALK_TEMPLATE_CODES.TREATMENT_COMPLETE,
  RECALL_NOTICE: ALIMTALK_TEMPLATE_CODES.RECALL_NOTICE,
  ORG_APPROVED: ALIMTALK_TEMPLATE_CODES.ORG_APPROVED,
  ORG_REJECTED: ALIMTALK_TEMPLATE_CODES.ORG_REJECTED,
};

export class NotificationService {
  /**
   * 알림 메시지 생성 (알림톡 발송 큐에 추가)
   */
  static async createMessage(input: {
    organizationId: string;
    patientId?: string;
    templateCode: TemplateCode;
    phone: string;
    variables?: Record<string, string>;
  }): Promise<ApiResponse<NotificationMessage>> {
    try {
      const adminClient = createAdminClient();

      const { data, error } = await adminClient
        .from('notification_messages')
        .insert({
          organization_id: input.organizationId,
          patient_id: input.patientId ?? null,
          template_code: input.templateCode,
          phone: input.phone,
          variables: (input.variables ?? {}) as Json,
          status: 'PENDING',
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: { code: 'CREATE_FAILED', message: error.message } };
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
   * 내 조직의 조직 알림 목록 조회
   */
  static async listAlerts(params?: {
    unreadOnly?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<{ items: OrganizationAlert[]; total: number }>> {
    try {
      const orgId = await AuthService.getOrganizationId();
      if (!orgId) {
        return { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } };
      }

      const supabase = await createClient();
      const page = params?.page ?? 1;
      const pageSize = params?.pageSize ?? 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('organization_alerts')
        .select('*', { count: 'exact' })
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (params?.unreadOnly) {
        query = query.eq('is_read', false);
      }

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
   * 알림 읽음 처리
   */
  static async markAsRead(alertId: string): Promise<ApiResponse<void>> {
    try {
      const orgId = await AuthService.getOrganizationId();
      if (!orgId) {
        return { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } };
      }

      const supabase = await createClient();
      const { error } = await supabase
        .from('organization_alerts')
        .update({ is_read: true })
        .eq('id', alertId)
        .eq('organization_id', orgId);

      if (error) {
        return { success: false, error: { code: 'UPDATE_FAILED', message: error.message } };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : '오류 발생' },
      };
    }
  }

  /**
   * 모든 알림 읽음 처리
   */
  static async markAllAsRead(): Promise<ApiResponse<void>> {
    try {
      const orgId = await AuthService.getOrganizationId();
      if (!orgId) {
        return { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } };
      }

      const supabase = await createClient();
      const { error } = await supabase
        .from('organization_alerts')
        .update({ is_read: true })
        .eq('organization_id', orgId)
        .eq('is_read', false);

      if (error) {
        return { success: false, error: { code: 'UPDATE_FAILED', message: error.message } };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : '오류 발생' },
      };
    }
  }

  /**
   * 읽지 않은 알림 개수
   */
  static async getUnreadCount(): Promise<ApiResponse<number>> {
    try {
      const orgId = await AuthService.getOrganizationId();
      if (!orgId) {
        return { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } };
      }

      const supabase = await createClient();
      const { count, error } = await supabase
        .from('organization_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('is_read', false);

      if (error) {
        return { success: false, error: { code: 'QUERY_FAILED', message: error.message } };
      }

      return { success: true, data: count ?? 0 };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : '오류 발생' },
      };
    }
  }

  /**
   * 조직 알림 생성 (내부용 - Admin 클라이언트)
   */
  static async createAlert(input: {
    organizationId: string;
    alertType: string;
    message: string;
  }): Promise<ApiResponse<OrganizationAlert>> {
    try {
      const adminClient = createAdminClient();

      const { data, error } = await adminClient
        .from('organization_alerts')
        .insert({
          organization_id: input.organizationId,
          alert_type: input.alertType,
          message: input.message,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: { code: 'CREATE_FAILED', message: error.message } };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : '오류 발생' },
      };
    }
  }

  // ==========================================================================
  // 알림톡 발송 트리거
  // ==========================================================================

  /**
   * 알림 메시지 생성 + 알림톡 발송 트리거
   * Server Action의 after() 비동기 콜백에서 호출
   */
  static async triggerAlimtalk(input: {
    organizationId: string;
    patientId?: string;
    templateCode: TemplateCode;
    phone: string;
    variables: Record<string, string>;
    recipientName?: string;
  }): Promise<void> {
    try {
      // 1. DB에 알림 메시지 생성
      const createResult = await NotificationService.createMessage({
        organizationId: input.organizationId,
        patientId: input.patientId,
        templateCode: input.templateCode,
        phone: input.phone,
        variables: input.variables,
      });

      if (!createResult.success || !createResult.data) {
        logger.error('알림 메시지 생성 실패', { error: createResult.error });
        return;
      }

      const messageId = createResult.data.id;

      // 2. Aligo 알림톡 발송 (비동기, fire-and-forget)
      const aligoTemplateCode = TEMPLATE_CODE_MAP[input.templateCode];

      sendNotification({
        templateCode: aligoTemplateCode,
        recipientPhone: input.phone,
        recipientName: input.recipientName,
        variables: input.variables,
        notificationMessageId: messageId,
      }).catch((error) => {
        logger.error('알림톡 발송 트리거 실패', {
          messageId,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    } catch (error) {
      logger.error('알림톡 트리거 오류', {
        templateCode: input.templateCode,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
