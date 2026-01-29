/**
 * 알림톡 발송 서비스
 * 템플릿 변수 바인딩, 발송, 재시도, 상태 조회
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';
import { withRetry } from '@/lib/retry';
import { sendAlimtalk as aligoSend } from '@/lib/aligo/client';
import {
  ALIMTALK_TEMPLATES,
  bindTemplateVariables,
  type AlimtalkTemplateCode,
} from '@/lib/aligo/templates';
import type { SendResult } from '@/lib/aligo/types';
import type { ApiResponse } from '@/types/api.types';
import { createSuccessResponse, createErrorResponse } from './common.service';

const logger = createLogger('alimtalk.service');

// ============================================================================
// 발송
// ============================================================================

export interface SendNotificationParams {
  templateCode: AlimtalkTemplateCode;
  recipientPhone: string;
  recipientName?: string;
  variables: Record<string, string>;
  /** 알림 메시지 DB ID (상태 업데이트용) */
  notificationMessageId?: string;
}

/**
 * 알림톡 발송 (재시도 포함)
 *
 * 1. 템플릿 조회 + 변수 바인딩
 * 2. Aligo API 호출 (최대 3회 재시도, 지수 백오프)
 * 3. 발송 결과 DB 업데이트
 */
export async function sendNotification(
  params: SendNotificationParams,
): Promise<ApiResponse<SendResult>> {
  try {
    const template = ALIMTALK_TEMPLATES[params.templateCode];
    if (!template) {
      return createErrorResponse('TEMPLATE_NOT_FOUND', `템플릿 없음: ${params.templateCode}`);
    }

    const { message, buttons } = bindTemplateVariables(template, params.variables);

    const result = await withRetry(
      () =>
        aligoSend({
          templateCode: params.templateCode,
          recipientPhone: params.recipientPhone,
          recipientName: params.recipientName,
          message,
          buttons,
        }),
      {
        maxRetries: 3,
        baseDelayMs: 60_000, // 1분, 2분, 4분
        maxDelayMs: 1_800_000, // 30분
        context: `alimtalk:${params.templateCode}`,
        shouldRetry: (error) => {
          // 설정 오류는 재시도하지 않음
          if (error instanceof Error && error.message.includes('환경변수')) return false;
          return true;
        },
      },
    );

    // DB 상태 업데이트
    if (params.notificationMessageId) {
      await updateMessageStatus(params.notificationMessageId, 'SENT', result.mid);
    }

    logger.info('알림톡 발송 성공', {
      templateCode: params.templateCode,
      mid: result.mid,
      testMode: result.testMode,
    });

    return createSuccessResponse(result);
  } catch (error) {
    logger.error('알림톡 발송 최종 실패', {
      templateCode: params.templateCode,
      phone: params.recipientPhone,
      error: error instanceof Error ? error.message : String(error),
    });

    // DB 실패 상태 업데이트
    if (params.notificationMessageId) {
      await updateMessageStatus(
        params.notificationMessageId,
        'FAILED',
        undefined,
        error instanceof Error ? error.message : '알 수 없는 오류',
      );
    }

    return createErrorResponse(
      'ALIMTALK_SEND_FAILED',
      error instanceof Error ? error.message : '알림톡 발송 실패',
    );
  }
}

// ============================================================================
// DB 상태 업데이트
// ============================================================================

async function updateMessageStatus(
  messageId: string,
  status: 'SENT' | 'FAILED',
  aligoMid?: number,
  errorMsg?: string,
): Promise<void> {
  try {
    const supabase = createAdminClient();

    const updateData: Record<string, unknown> = { status };

    if (status === 'SENT') {
      updateData['is_sent'] = true;
      updateData['sent_at'] = new Date().toISOString();
      if (aligoMid) updateData['aligo_mid'] = String(aligoMid);
    } else {
      updateData['error_msg'] = errorMsg;
    }

    const { error } = await supabase
      .from('notification_messages')
      .update(updateData)
      .eq('id', messageId);

    if (error) {
      logger.error('알림 메시지 상태 업데이트 실패', { messageId, error: error.message });
    }
  } catch (error) {
    logger.error('알림 메시지 상태 업데이트 오류', {
      messageId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// ============================================================================
// 발송 상태 조회
// ============================================================================

export async function getMessageStatus(
  messageId: string,
): Promise<ApiResponse<{ status: string; sentAt: string | null; errorMsg: string | null }>> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('notification_messages')
      .select('status, sent_at, error_msg')
      .eq('id', messageId)
      .single();

    if (error || !data) {
      return createErrorResponse('NOT_FOUND', '메시지를 찾을 수 없습니다.');
    }

    return createSuccessResponse({
      status: (data as Record<string, unknown>).status as string ?? 'UNKNOWN',
      sentAt: (data as Record<string, unknown>).sent_at as string | null ?? null,
      errorMsg: (data as Record<string, unknown>).error_msg as string | null ?? null,
    });
  } catch (error) {
    return createErrorResponse(
      'QUERY_ERROR',
      error instanceof Error ? error.message : '조회 오류',
    );
  }
}
