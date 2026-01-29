/**
 * 카카오 알림톡 템플릿 정의
 * 시술 완료, 출고 알림, 회수 알림 등
 */

import type { AligoButton } from './types';

// ============================================================================
// 템플릿 코드
// ============================================================================

export const ALIMTALK_TEMPLATE_CODES = {
  /** 정품 인증 완료 (시술 후 환자에게 발송) */
  TREATMENT_COMPLETE: 'TM_CERT_COMPLETE',
  /** 출고 알림 (유통사→병원 출고 시) */
  SHIPMENT_NOTICE: 'TM_SHIPMENT',
  /** 회수 알림 (리콜/폐기 시 환자에게 발송) */
  RECALL_NOTICE: 'TM_RECALL',
  /** 조직 승인 알림 */
  ORG_APPROVED: 'TM_ORG_APPROVED',
  /** 조직 반려 알림 */
  ORG_REJECTED: 'TM_ORG_REJECTED',
} as const;

export type AlimtalkTemplateCode =
  (typeof ALIMTALK_TEMPLATE_CODES)[keyof typeof ALIMTALK_TEMPLATE_CODES];

// ============================================================================
// 템플릿 변수 타입
// ============================================================================

export interface TreatmentCompleteVars {
  patientName: string;
  hospitalName: string;
  productName: string;
  treatmentDate: string;
  virtualCode: string;
  verifyUrl: string;
}

export interface ShipmentNoticeVars {
  hospitalName: string;
  productName: string;
  quantity: string;
  shipmentDate: string;
  distributorName: string;
}

export interface RecallNoticeVars {
  patientName: string;
  hospitalName: string;
  productName: string;
  treatmentDate: string;
  recallReason: string;
  contactPhone: string;
}

export interface OrgApprovedVars {
  orgName: string;
  orgType: string;
}

export interface OrgRejectedVars {
  orgName: string;
  rejectReason: string;
}

// ============================================================================
// 템플릿 정의
// ============================================================================

export interface AlimtalkTemplate {
  code: AlimtalkTemplateCode;
  name: string;
  messageType: 'BA' | 'EX' | 'AD' | 'MI';
  /** #{변수명} 형태의 플레이스홀더를 포함한 본문 */
  content: string;
  buttons?: AligoButton[];
}

export const ALIMTALK_TEMPLATES: Record<AlimtalkTemplateCode, AlimtalkTemplate> = {
  [ALIMTALK_TEMPLATE_CODES.TREATMENT_COMPLETE]: {
    code: ALIMTALK_TEMPLATE_CODES.TREATMENT_COMPLETE,
    name: '정품 인증 완료',
    messageType: 'EX',
    content: [
      '#{patientName}님, 안녕하세요.',
      '',
      '#{hospitalName}에서 시술한 #{productName} 제품의 정품 인증이 완료되었습니다.',
      '',
      '■ 시술일: #{treatmentDate}',
      '■ 인증코드: #{virtualCode}',
      '',
      '아래 버튼을 눌러 정품 여부를 확인하실 수 있습니다.',
    ].join('\n'),
    buttons: [
      {
        name: '정품 확인하기',
        linkType: 'WL',
        linkM: '#{verifyUrl}',
        linkP: '#{verifyUrl}',
      },
    ],
  },

  [ALIMTALK_TEMPLATE_CODES.SHIPMENT_NOTICE]: {
    code: ALIMTALK_TEMPLATE_CODES.SHIPMENT_NOTICE,
    name: '출고 알림',
    messageType: 'EX',
    content: [
      '#{hospitalName} 담당자님, 안녕하세요.',
      '',
      '#{distributorName}에서 제품이 출고되었습니다.',
      '',
      '■ 제품: #{productName}',
      '■ 수량: #{quantity}개',
      '■ 출고일: #{shipmentDate}',
      '',
      '입고 확인 부탁드립니다.',
    ].join('\n'),
  },

  [ALIMTALK_TEMPLATE_CODES.RECALL_NOTICE]: {
    code: ALIMTALK_TEMPLATE_CODES.RECALL_NOTICE,
    name: '회수 알림',
    messageType: 'EX',
    content: [
      '#{patientName}님, 안녕하세요.',
      '',
      '#{hospitalName}에서 안내드립니다.',
      '#{treatmentDate}에 시술하신 #{productName} 제품에 대해 회수 안내드립니다.',
      '',
      '■ 사유: #{recallReason}',
      '■ 문의: #{contactPhone}',
      '',
      '불편을 드려 죄송합니다. 문의사항은 위 연락처로 연락 부탁드립니다.',
    ].join('\n'),
  },

  [ALIMTALK_TEMPLATE_CODES.ORG_APPROVED]: {
    code: ALIMTALK_TEMPLATE_CODES.ORG_APPROVED,
    name: '조직 승인',
    messageType: 'BA',
    content: [
      '#{orgName} #{orgType} 가입이 승인되었습니다.',
      '',
      '지금 바로 로그인하여 서비스를 이용하실 수 있습니다.',
    ].join('\n'),
  },

  [ALIMTALK_TEMPLATE_CODES.ORG_REJECTED]: {
    code: ALIMTALK_TEMPLATE_CODES.ORG_REJECTED,
    name: '조직 반려',
    messageType: 'BA',
    content: [
      '#{orgName} 가입 신청이 반려되었습니다.',
      '',
      '■ 사유: #{rejectReason}',
      '',
      '수정 후 재신청 부탁드립니다.',
    ].join('\n'),
  },
};

// ============================================================================
// 템플릿 변수 바인딩
// ============================================================================

/**
 * 템플릿 본문에 변수를 바인딩
 * #{변수명} → 실제 값으로 치환
 */
export function bindTemplateVariables(
  template: AlimtalkTemplate,
  variables: Record<string, string>,
): { message: string; buttons?: AligoButton[] } {
  let message = template.content;

  for (const [key, value] of Object.entries(variables)) {
    message = message.replaceAll(`#{${key}}`, value);
  }

  // 버튼 URL에도 변수 바인딩
  const buttons = template.buttons?.map((btn) => {
    const bound = { ...btn };
    for (const [key, value] of Object.entries(variables)) {
      if (bound.linkM) bound.linkM = bound.linkM.replaceAll(`#{${key}}`, value);
      if (bound.linkP) bound.linkP = bound.linkP.replaceAll(`#{${key}}`, value);
      if (bound.linkI) bound.linkI = bound.linkI.replaceAll(`#{${key}}`, value);
      if (bound.linkA) bound.linkA = bound.linkA.replaceAll(`#{${key}}`, value);
    }
    return bound;
  });

  return { message, buttons };
}
