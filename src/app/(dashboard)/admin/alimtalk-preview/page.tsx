'use client';

import { useState } from 'react';
import {
  ALIMTALK_TEMPLATES,
  ALIMTALK_TEMPLATE_CODES,
  bindTemplateVariables,
  type AlimtalkTemplateCode,
} from '@/lib/aligo/templates';

// ============================================================================
// 샘플 데이터
// ============================================================================

const SAMPLE_VARIABLES: Record<AlimtalkTemplateCode, Record<string, string>> = {
  [ALIMTALK_TEMPLATE_CODES.TREATMENT_COMPLETE]: {
    patientName: '김서연',
    hospitalName: '연세미래피부과',
    productName: 'JUVEDERM VOLUMA XC',
    treatmentDate: '2025-01-15',
    virtualCode: 'VC-A1B2C3D4',
    verifyUrl: 'https://neo-certify.kr/verify/VC-A1B2C3D4',
  },
  [ALIMTALK_TEMPLATE_CODES.SHIPMENT_NOTICE]: {
    hospitalName: '연세미래피부과',
    productName: 'JUVEDERM VOLUMA XC',
    quantity: '50',
    shipmentDate: '2025-01-14',
    distributorName: '한국앨러간',
  },
  [ALIMTALK_TEMPLATE_CODES.RECALL_NOTICE]: {
    patientName: '김서연',
    hospitalName: '연세미래피부과',
    productName: 'JUVEDERM VOLUMA XC',
    treatmentDate: '2025-01-10',
    recallReason: '제조사 자발적 리콜 (Lot #2025-A)',
    contactPhone: '02-1234-5678',
  },
  [ALIMTALK_TEMPLATE_CODES.ORG_APPROVED]: {
    orgName: '연세미래피부과',
    orgType: '병원',
  },
  [ALIMTALK_TEMPLATE_CODES.ORG_REJECTED]: {
    orgName: '테스트의원',
    rejectReason: '사업자등록증이 불일치합니다. 재확인 후 재신청 부탁드립니다.',
  },
};

// ============================================================================
// Components
// ============================================================================

function KakaoMessage({
  message,
  buttons,
}: {
  message: string;
  buttons?: { name: string; linkM?: string; linkP?: string }[];
}) {
  return (
    <div className="flex flex-col items-start gap-1 max-w-xs">
      {/* 카카오톡 프로필 */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-9 h-9 rounded-full bg-yellow-400 flex items-center justify-center text-sm font-bold">
          알림
        </div>
        <span className="text-sm font-medium text-gray-700">카카오 알림톡</span>
      </div>

      {/* 말풍선 */}
      <div className="relative ml-11">
        {/* 꼬리 */}
        <div className="absolute -left-2 top-2 w-3 h-3 bg-white border-l border-t border-gray-200 rotate-[-45deg]" />

        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
          <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans leading-relaxed">
            {message}
          </pre>

          {/* 버튼 */}
          {buttons && buttons.length > 0 && (
            <div className="mt-3 flex flex-col gap-1.5 border-t border-gray-100 pt-3">
              {buttons.map((btn, i) => (
                <button
                  key={i}
                  className="w-full py-2 px-3 text-sm text-blue-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                  onClick={(e) => e.preventDefault()}
                >
                  {btn.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TemplateCard({
  code,
  isSelected,
  onClick,
}: {
  code: AlimtalkTemplateCode;
  isSelected: boolean;
  onClick: () => void;
}) {
  const template = ALIMTALK_TEMPLATES[code];
  const typeLabels: Record<string, string> = {
    BA: '기본형',
    EX: '부가정보형',
    AD: '광고형',
    MI: '복합형',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-yellow-400 bg-yellow-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-gray-900">{template.name}</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
          {typeLabels[template.messageType] ?? template.messageType}
        </span>
      </div>
      <p className="text-xs text-gray-500 font-mono">{template.code}</p>
      {template.buttons && (
        <p className="text-xs text-blue-500 mt-1">버튼 {template.buttons.length}개</p>
      )}
    </button>
  );
}

// ============================================================================
// Page
// ============================================================================

export default function AlimtalkPreviewPage() {
  const templateCodes = Object.values(ALIMTALK_TEMPLATE_CODES);
  const [selectedCode, setSelectedCode] = useState<AlimtalkTemplateCode>(templateCodes[0]!);

  const template = ALIMTALK_TEMPLATES[selectedCode];
  const variables = SAMPLE_VARIABLES[selectedCode];
  const { message, buttons } = bindTemplateVariables(template, variables);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">알림톡 템플릿 미리보기</h1>
        <p className="text-sm text-gray-500 mt-1">
          카카오 알림톡 템플릿을 샘플 데이터로 미리 확인합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 좌측: 템플릿 선택 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">템플릿 목록</h2>
          <div className="space-y-3">
            {templateCodes.map((code) => (
              <TemplateCard
                key={code}
                code={code}
                isSelected={code === selectedCode}
                onClick={() => setSelectedCode(code)}
              />
            ))}
          </div>
        </div>

        {/* 우측: 프리뷰 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">미리보기</h2>

          {/* 카카오톡 화면 Mock */}
          <div className="rounded-2xl border border-gray-300 bg-[#B2C7D9] p-6 min-h-[400px] shadow-inner">
            <KakaoMessage message={message} buttons={buttons} />
          </div>

          {/* 변수 목록 */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">바인딩 변수</h3>
            <div className="space-y-1">
              {Object.entries(variables).map(([key, value]) => (
                <div key={key} className="flex gap-2 text-xs">
                  <code className="text-purple-600 font-mono whitespace-nowrap">
                    {'#{'}
                    {key}
                    {'}'}
                  </code>
                  <span className="text-gray-400">→</span>
                  <span className="text-gray-700">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Raw 템플릿 */}
          <details className="bg-white rounded-lg border border-gray-200 p-4">
            <summary className="text-sm font-semibold text-gray-700 cursor-pointer">
              원본 템플릿 보기
            </summary>
            <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded">
              {template.content}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}
