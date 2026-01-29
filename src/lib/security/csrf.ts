/**
 * CSRF 보호 유틸
 *
 * Next.js Server Actions는 내장 CSRF 보호가 있지만,
 * 커스텀 API 라우트에서 필요한 경우 사용
 */

import { randomBytes, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const CSRF_COOKIE_NAME = '__csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;

/**
 * CSRF 토큰 생성 및 쿠키 설정
 */
export async function generateCsrfToken(): Promise<string> {
  const token = randomBytes(TOKEN_LENGTH).toString('hex');

  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 3600, // 1시간
  });

  return token;
}

/**
 * CSRF 토큰 검증
 * 쿠키의 토큰과 헤더의 토큰을 비교
 */
export async function verifyCsrfToken(request: Request): Promise<boolean> {
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (!headerToken) return false;

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  if (!cookieToken) return false;

  if (headerToken.length !== cookieToken.length) return false;

  try {
    return timingSafeEqual(
      Buffer.from(headerToken, 'utf-8'),
      Buffer.from(cookieToken, 'utf-8'),
    );
  } catch {
    return false;
  }
}
