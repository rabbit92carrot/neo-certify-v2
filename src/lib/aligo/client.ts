/**
 * Aligo REST API 클라이언트
 * 인증, 요청 래퍼, mock 모드 지원
 */

import { createLogger } from '@/lib/logger';
import type {
  AligoConfig,
  AligoResponse,
  AligoSendResponse,
  AligoTemplateListResponse,
  SendAlimtalkParams,
  SendResult,
  RegisterTemplateParams,
} from './types';

const logger = createLogger('aligo.client');

const ALIGO_API_BASE = 'https://kakaoapi.aligo.in';

// ============================================================================
// 설정
// ============================================================================

export function getAligoConfig(): AligoConfig {
  return {
    apiKey: process.env.ALIGO_API_KEY ?? '',
    userId: process.env.ALIGO_USER_ID ?? '',
    senderKey: process.env.KAKAO_SENDER_KEY ?? '',
    senderPhone: process.env.ALIGO_SENDER_PHONE ?? '',
    testMode: process.env.ALIGO_TEST_MODE === 'Y',
  };
}

export function validateConfig(config: AligoConfig): string | null {
  if (!config.apiKey) return 'ALIGO_API_KEY 환경변수가 설정되지 않았습니다.';
  if (!config.userId) return 'ALIGO_USER_ID 환경변수가 설정되지 않았습니다.';
  if (!config.senderKey) return 'KAKAO_SENDER_KEY 환경변수가 설정되지 않았습니다.';
  return null;
}

// ============================================================================
// 공통 API 호출
// ============================================================================

async function callApi<T extends AligoResponse>(
  endpoint: string,
  params: Record<string, string>,
): Promise<T> {
  const config = getAligoConfig();
  const configError = validateConfig(config);
  if (configError) {
    throw new Error(configError);
  }

  const formData = new URLSearchParams();
  formData.append('apikey', config.apiKey);
  formData.append('userid', config.userId);
  formData.append('senderkey', config.senderKey);

  for (const [key, value] of Object.entries(params)) {
    formData.append(key, value);
  }

  const url = `${ALIGO_API_BASE}${endpoint}`;
  logger.info('알리고 API 호출', { endpoint, params: Object.keys(params) });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });

  if (!response.ok) {
    throw new Error(`알리고 API HTTP 오류: ${response.status}`);
  }

  const result = (await response.json()) as T;

  if (String(result.code) !== '0') {
    logger.error('알리고 API 오류 응답', {
      code: result.code,
      message: result.message,
      endpoint,
    });
  }

  return result;
}

// ============================================================================
// 알림톡 발송
// ============================================================================

export async function sendAlimtalk(params: SendAlimtalkParams): Promise<SendResult> {
  const config = getAligoConfig();

  if (config.testMode) {
    logger.info('[MOCK] 알림톡 발송 시뮬레이션', {
      templateCode: params.templateCode,
      recipientPhone: params.recipientPhone,
      messageLength: params.message.length,
    });
    logger.info('[MOCK] 메시지 전문:', { message: params.message });
    return { mid: 0, successCount: 1, failCount: 0, testMode: true };
  }

  const apiParams: Record<string, string> = {
    tpl_code: params.templateCode,
    sender: config.senderPhone,
    receiver_1: params.recipientPhone,
    message_1: params.message,
  };

  if (params.recipientName) apiParams['recvname_1'] = params.recipientName;
  if (params.subject) apiParams['subject_1'] = params.subject;
  if (params.buttons) {
    apiParams['button_1'] = JSON.stringify({ button: params.buttons });
  }
  if (params.failoverMessage) {
    apiParams['failover'] = 'Y';
    apiParams['fmessage_1'] = params.failoverMessage;
  }

  const result = await callApi<AligoSendResponse>('/akv10/alimtalk/send/', apiParams);

  if (String(result.code) !== '0') {
    throw new Error(`알림톡 발송 실패: ${result.message}`);
  }

  return {
    mid: result.info?.mid ?? 0,
    successCount: result.info?.scnt ?? 0,
    failCount: result.info?.fcnt ?? 0,
    testMode: false,
  };
}

// ============================================================================
// 템플릿 관리
// ============================================================================

export async function registerTemplate(params: RegisterTemplateParams): Promise<AligoResponse> {
  const config = getAligoConfig();

  if (config.testMode) {
    logger.info('[MOCK] 템플릿 등록', { tplCode: params.tplCode, tplName: params.tplName });
    return { code: 0, message: '테스트 모드 - 템플릿 등록 시뮬레이션' };
  }

  const apiParams: Record<string, string> = {
    tpl_code: params.tplCode,
    tpl_name: params.tplName,
    tpl_content: params.tplContent,
    message_type: params.messageType,
  };

  if (params.emphasizeType) apiParams['emphasize_type'] = params.emphasizeType;
  if (params.tplEmTitle) apiParams['tpl_emtitle'] = params.tplEmTitle;
  if (params.tplEmSubtitle) apiParams['tpl_emsubtitle'] = params.tplEmSubtitle;
  if (params.tplButton) {
    apiParams['tpl_button'] = JSON.stringify({ button: params.tplButton });
  }

  return callApi<AligoResponse>('/akv10/template/add/', apiParams);
}

export async function requestTemplateReview(tplCode: string): Promise<AligoResponse> {
  const config = getAligoConfig();

  if (config.testMode) {
    logger.info('[MOCK] 심사 요청', { tplCode });
    return { code: 0, message: '테스트 모드 - 심사 요청 시뮬레이션' };
  }

  return callApi<AligoResponse>('/akv10/template/request/', { tpl_code: tplCode });
}

export async function listTemplates(): Promise<AligoTemplateListResponse> {
  const config = getAligoConfig();

  if (config.testMode) {
    logger.info('[MOCK] 템플릿 목록 조회');
    return { code: 0, message: 'OK', list: [] };
  }

  return callApi<AligoTemplateListResponse>('/akv10/template/list/', {});
}
