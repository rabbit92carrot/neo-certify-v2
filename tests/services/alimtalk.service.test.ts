import { describe, it, expect } from 'vitest';
import {
  ALIMTALK_TEMPLATES,
  ALIMTALK_TEMPLATE_CODES,
  bindTemplateVariables,
} from '@/lib/aligo/templates';

describe('알림톡 템플릿 변수 바인딩', () => {
  it('시술완료 템플릿 변수 치환', () => {
    const template = ALIMTALK_TEMPLATES[ALIMTALK_TEMPLATE_CODES.TREATMENT_COMPLETE];
    const vars = {
      patientName: '홍길동',
      hospitalName: '테스트병원',
      productName: '테스트제품',
      treatmentDate: '2025-01-01',
      virtualCode: 'VC-12345',
      verifyUrl: 'https://example.com/verify/VC-12345',
    };

    const { message, buttons } = bindTemplateVariables(template, vars);

    expect(message).toContain('홍길동님, 안녕하세요.');
    expect(message).toContain('테스트병원');
    expect(message).toContain('테스트제품');
    expect(message).toContain('2025-01-01');
    expect(message).toContain('VC-12345');
    expect(message).not.toContain('#{');

    // 버튼 URL도 바인딩
    expect(buttons).toBeDefined();
    expect(buttons![0]!.linkM).toBe('https://example.com/verify/VC-12345');
  });

  it('출고알림 템플릿 변수 치환', () => {
    const template = ALIMTALK_TEMPLATES[ALIMTALK_TEMPLATE_CODES.SHIPMENT_NOTICE];
    const { message } = bindTemplateVariables(template, {
      hospitalName: '서울병원',
      productName: 'PRODUCT-A',
      quantity: '100',
      shipmentDate: '2025-02-01',
      distributorName: '유통사A',
    });

    expect(message).toContain('서울병원 담당자님');
    expect(message).toContain('100개');
    expect(message).toContain('유통사A');
    expect(message).not.toContain('#{');
  });

  it('회수알림 템플릿 변수 치환', () => {
    const template = ALIMTALK_TEMPLATES[ALIMTALK_TEMPLATE_CODES.RECALL_NOTICE];
    const { message } = bindTemplateVariables(template, {
      patientName: '이영희',
      hospitalName: '강남병원',
      productName: 'RECALL-PRODUCT',
      treatmentDate: '2024-12-01',
      recallReason: '품질 이슈',
      contactPhone: '010-0000-0000',
    });

    expect(message).toContain('이영희님');
    expect(message).toContain('품질 이슈');
    expect(message).toContain('010-0000-0000');
  });

  it('조직 승인/반려 템플릿', () => {
    const approved = bindTemplateVariables(
      ALIMTALK_TEMPLATES[ALIMTALK_TEMPLATE_CODES.ORG_APPROVED],
      { orgName: '테스트조직', orgType: '병원' },
    );
    expect(approved.message).toContain('테스트조직 병원 가입이 승인');

    const rejected = bindTemplateVariables(
      ALIMTALK_TEMPLATES[ALIMTALK_TEMPLATE_CODES.ORG_REJECTED],
      { orgName: '반려조직', rejectReason: '서류 미비' },
    );
    expect(rejected.message).toContain('서류 미비');
  });

  it('미바인딩 변수는 플레이스홀더 유지', () => {
    const template = ALIMTALK_TEMPLATES[ALIMTALK_TEMPLATE_CODES.TREATMENT_COMPLETE];
    const { message } = bindTemplateVariables(template, { patientName: '테스트' });
    expect(message).toContain('테스트님');
    expect(message).toContain('#{hospitalName}'); // 미바인딩
  });

  it('모든 템플릿 코드에 대응하는 정의 존재', () => {
    for (const code of Object.values(ALIMTALK_TEMPLATE_CODES)) {
      expect(ALIMTALK_TEMPLATES[code]).toBeDefined();
      expect(ALIMTALK_TEMPLATES[code].content.length).toBeGreaterThan(0);
    }
  });
});
