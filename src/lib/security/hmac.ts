/**
 * HMAC 키 생성/검증/로테이션 유틸
 * 가상코드 서명 및 API 요청 무결성 검증
 */

import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

// ============================================================================
// HMAC 생성/검증
// ============================================================================

/**
 * HMAC-SHA256 서명 생성
 */
export function generateHmac(data: string, secret?: string): string {
  const key = secret ?? getHmacSecret();
  return createHmac('sha256', key).update(data).digest('hex');
}

/**
 * HMAC-SHA256 서명 검증 (timing-safe)
 */
export function verifyHmac(data: string, signature: string, secret?: string): boolean {
  const key = secret ?? getHmacSecret();
  const expected = createHmac('sha256', key).update(data).digest('hex');

  if (expected.length !== signature.length) return false;

  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

// ============================================================================
// 키 관리
// ============================================================================

/**
 * 현재 HMAC 시크릿 키 가져오기
 * 환경 변수에서 읽음 (Supabase Vault 연동 가능)
 */
function getHmacSecret(): string {
  const secret = process.env.HMAC_SECRET_KEY;
  if (!secret) {
    throw new Error('HMAC_SECRET_KEY 환경변수가 설정되지 않았습니다.');
  }
  return secret;
}

/**
 * 이전 키도 함께 검증 (로테이션 기간 동안 호환)
 */
export function verifyHmacWithRotation(data: string, signature: string): boolean {
  // 현재 키로 검증
  if (verifyHmac(data, signature)) return true;

  // 이전 키로 검증 (로테이션 기간)
  const previousSecret = process.env.HMAC_SECRET_KEY_PREVIOUS;
  if (previousSecret) {
    return verifyHmac(data, signature, previousSecret);
  }

  return false;
}

/**
 * 새 HMAC 시크릿 키 생성 (로테이션 시 사용)
 */
export function generateSecretKey(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

// ============================================================================
// 가상코드 서명
// ============================================================================

/**
 * 가상코드에 HMAC 서명 추가
 * 형식: {코드}.{서명}
 */
export function signVirtualCode(code: string): string {
  const signature = generateHmac(code);
  return `${code}.${signature}`;
}

/**
 * 서명된 가상코드 검증
 */
export function verifySignedVirtualCode(signedCode: string): { valid: boolean; code: string } {
  const dotIndex = signedCode.lastIndexOf('.');
  if (dotIndex === -1) {
    return { valid: false, code: '' };
  }

  const code = signedCode.slice(0, dotIndex);
  const signature = signedCode.slice(dotIndex + 1);

  return {
    valid: verifyHmacWithRotation(code, signature),
    code,
  };
}
