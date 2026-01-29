/**
 * 공통 Zod 스키마
 */
import { z } from 'zod';

// ============================================================================
// 기본 스키마
// ============================================================================

export const uuidSchema = z.string().uuid('올바른 UUID 형식이 아닙니다');

export const emailSchema = z
  .string()
  .min(1, '이메일을 입력해주세요')
  .email('올바른 이메일 형식이 아닙니다');

export const passwordSchema = z
  .string()
  .min(8, '비밀번호는 8자 이상이어야 합니다')
  .max(72, '비밀번호는 72자 이하여야 합니다');

export const phoneNumberSchema = z
  .string()
  .regex(/^01[016789]\d{7,8}$/, '올바른 전화번호 형식이 아닙니다 (숫자만)');

export const phoneNumberInputSchema = z
  .string()
  .min(1, '전화번호를 입력해주세요')
  .transform((val) => val.replace(/[^0-9]/g, ''))
  .pipe(phoneNumberSchema);

export const businessNumberSchema = z
  .string()
  .regex(/^\d{10}$/, '사업자번호는 10자리 숫자입니다');

export const businessNumberInputSchema = z
  .string()
  .min(1, '사업자번호를 입력해주세요')
  .transform((val) => val.replace(/[^0-9]/g, ''))
  .pipe(businessNumberSchema);

// ============================================================================
// 수량 스키마
// ============================================================================

export const quantitySchema = z
  .number()
  .int('수량은 정수여야 합니다')
  .min(1, '수량은 1 이상이어야 합니다')
  .max(100000, '수량은 100,000 이하여야 합니다');

export const quantityInputSchema = z
  .string()
  .min(1, '수량을 입력해주세요')
  .transform((val) => parseInt(val, 10))
  .pipe(quantitySchema);

// ============================================================================
// 날짜 스키마
// ============================================================================

export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다');

export const dateInputSchema = z
  .string()
  .min(1, '날짜를 선택해주세요')
  .pipe(dateStringSchema);

// ============================================================================
// 파일 스키마
// ============================================================================

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

export const fileUploadSchema = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE, '파일 크기는 5MB 이하여야 합니다')
  .refine(
    (file) => ACCEPTED_FILE_TYPES.includes(file.type),
    'JPG, PNG, PDF 파일만 업로드 가능합니다'
  );

export const optionalFileUploadSchema = fileUploadSchema.optional();

// ============================================================================
// 문자열 스키마
// ============================================================================

export const requiredStringSchema = z.string().min(1, '필수 입력 항목입니다');

export const trimmedRequiredStringSchema = z
  .string()
  .trim()
  .min(1, '필수 입력 항목입니다');

export const maxLengthStringSchema = (max: number) =>
  z.string().max(max, `${max}자 이하로 입력해주세요`);

// ============================================================================
// 유틸리티 함수
// ============================================================================

export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

export function normalizeBusinessNumber(bn: string): string {
  return bn.replace(/[^0-9]/g, '');
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = normalizePhoneNumber(phone);
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function formatBusinessNumber(bn: string): string {
  const cleaned = normalizeBusinessNumber(bn);
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
  }
  return bn;
}
