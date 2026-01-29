/**
 * 지수 백오프 재시도 유틸리티
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('retry');

export interface RetryOptions {
  /** 최대 재시도 횟수 (기본 3) */
  maxRetries?: number;
  /** 기본 지연 시간 ms (기본 1000) */
  baseDelayMs?: number;
  /** 최대 지연 시간 ms (기본 30000) */
  maxDelayMs?: number;
  /** 재시도할 에러 판별 함수 */
  shouldRetry?: (error: unknown) => boolean;
  /** 재시도 컨텍스트 이름 (로깅용) */
  context?: string;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  shouldRetry: () => true,
  context: 'unknown',
};

/**
 * 지수 백오프로 함수 재시도
 *
 * 지연 계산: baseDelay * 2^attempt + jitter
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt >= opts.maxRetries) break;
      if (!opts.shouldRetry(error)) break;

      const delay = Math.min(
        opts.baseDelayMs * Math.pow(2, attempt) + Math.random() * 500,
        opts.maxDelayMs,
      );

      logger.warn(`[${opts.context}] 재시도 ${attempt + 1}/${opts.maxRetries} (${Math.round(delay)}ms 후)`, {
        error: error instanceof Error ? error.message : String(error),
      });

      await sleep(delay);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
