/**
 * Common Service (SSOT)
 * 공통 유틸리티 함수 — 다른 서비스에서 import하여 사용
 */

import type { ApiResponse } from '@/types/api.types';

// ============================================================================
// ApiResponse helpers
// ============================================================================

export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function createErrorResponse<T = never>(
  code: string,
  message: string,
  details?: Record<string, string[]>
): ApiResponse<T> {
  return { success: false, error: { code, message, details } };
}

export function createNotFoundResponse<T = never>(
  message = '데이터를 찾을 수 없습니다.'
): ApiResponse<T> {
  return createErrorResponse('NOT_FOUND', message);
}

export function createUnauthorizedResponse<T = never>(
  message = '로그인이 필요합니다.'
): ApiResponse<T> {
  return createErrorResponse('UNAUTHORIZED', message);
}

export function createForbiddenResponse<T = never>(
  message = '접근 권한이 없습니다.'
): ApiResponse<T> {
  return createErrorResponse('FORBIDDEN', message);
}

// ============================================================================
// RPC result parsing (Zod-based)
// ============================================================================

import { z } from 'zod';
import { createLogger } from '@/lib/logger';

const logger = createLogger('common.service');

/**
 * RPC 결과 배열을 Zod 스키마로 파싱
 */
export function parseRpcArray<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  funcName: string
): { success: true; data: z.infer<T>[] } | { success: false; error: string } {
  if (!Array.isArray(data)) {
    // Single row → wrap
    if (data != null) {
      const parsed = schema.safeParse(data);
      if (parsed.success) return { success: true, data: [parsed.data] };
      logger.error(`${funcName} single row parse failed`, parsed.error.format());
      return { success: false, error: `${funcName} 결과 파싱 실패` };
    }
    return { success: true, data: [] };
  }

  const results: z.infer<T>[] = [];
  for (const row of data) {
    const parsed = schema.safeParse(row);
    if (!parsed.success) {
      logger.error(`${funcName} row parse failed`, parsed.error.format());
      return { success: false, error: `${funcName} 결과 파싱 실패` };
    }
    results.push(parsed.data);
  }
  return { success: true, data: results };
}

/**
 * RPC 결과 단일 행을 Zod 스키마로 파싱
 */
export function parseRpcSingle<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  funcName: string
): { success: true; data: z.infer<T> | null } | { success: false; error: string } {
  if (data == null) return { success: true, data: null };

  // Array result → take first
  const row = Array.isArray(data) ? data[0] : data;
  if (row == null) return { success: true, data: null };

  const parsed = schema.safeParse(row);
  if (!parsed.success) {
    logger.error(`${funcName} parse failed`, parsed.error.format());
    return { success: false, error: `${funcName} 결과 파싱 실패` };
  }
  return { success: true, data: parsed.data };
}

// ============================================================================
// Organization name cache (for history display)
// ============================================================================

import { createClient } from '@/lib/supabase/server';

export function createOrganizationNameCache(): Map<string, string> {
  return new Map();
}

export async function getOrganizationName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  cache?: Map<string, string>
): Promise<string> {
  if (cache?.has(orgId)) return cache.get(orgId)!;

  const { data } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single();

  const name = data?.name ?? '알 수 없음';
  cache?.set(orgId, name);
  return name;
}

export { maskPhoneNumber } from '@/lib/utils';
