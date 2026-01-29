/**
 * Aligo API 요청/응답 타입 정의
 */

// ============================================================================
// 설정
// ============================================================================

export interface AligoConfig {
  apiKey: string;
  userId: string;
  senderKey: string;
  senderPhone: string;
  testMode: boolean;
}

// ============================================================================
// 공통 응답
// ============================================================================

export interface AligoResponse {
  code: number | string;
  message: string;
}

export interface AligoSendResponse extends AligoResponse {
  info?: {
    type: string;
    mid: number;
    current: string;
    unit: number;
    total: number;
    scnt: number;
    fcnt: number;
  };
}

export interface AligoTemplateListResponse extends AligoResponse {
  list?: AligoTemplateItem[];
}

// ============================================================================
// 템플릿
// ============================================================================

export interface AligoTemplateItem {
  templtCode: string;
  templtName: string;
  templtContent: string;
  status: string;
  inspStatus: string;
  cdate: string;
}

export interface AligoButton {
  name: string;
  linkType: 'WL' | 'AL' | 'DS' | 'BK' | 'BC';
  linkM?: string;
  linkP?: string;
  linkI?: string;
  linkA?: string;
}

// ============================================================================
// 발송 파라미터
// ============================================================================

export interface SendAlimtalkParams {
  templateCode: string;
  recipientPhone: string;
  recipientName?: string;
  subject?: string;
  message: string;
  buttons?: AligoButton[];
  /** SMS/LMS 대체 발송 메시지 */
  failoverMessage?: string;
}

export interface SendResult {
  mid: number;
  successCount: number;
  failCount: number;
  testMode: boolean;
}

// ============================================================================
// 템플릿 등록
// ============================================================================

export interface RegisterTemplateParams {
  tplCode: string;
  tplName: string;
  tplContent: string;
  messageType: 'BA' | 'EX' | 'AD' | 'MI';
  emphasizeType?: 'NONE' | 'TEXT' | 'IMAGE';
  tplEmTitle?: string;
  tplEmSubtitle?: string;
  tplButton?: AligoButton[];
}

// ============================================================================
// 웹훅
// ============================================================================

export interface AlimtalkWebhookPayload {
  mid: string;
  msgid: string;
  phone: string;
  status: 'SUCCESS' | 'FAIL';
  sentDate: string;
  rslt: string;
  message?: string;
}
