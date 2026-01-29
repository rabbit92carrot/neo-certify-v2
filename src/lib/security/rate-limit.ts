/**
 * Rate Limiting 설정
 * @upstash/ratelimit 기반 또는 메모리 기반 폴백
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('rate-limit');

// ============================================================================
// Rate Limiter 인터페이스
// ============================================================================

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

interface RateLimiter {
  limit(identifier: string): Promise<RateLimitResult>;
}

// ============================================================================
// 메모리 기반 Rate Limiter (Upstash 미설정 시 폴백)
// ============================================================================

interface SlidingWindowEntry {
  count: number;
  resetAt: number;
}

function createMemoryRateLimiter(maxRequests: number, windowMs: number): RateLimiter {
  const store = new Map<string, SlidingWindowEntry>();

  // 주기적 정리 (메모리 누수 방지)
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 60_000);

  return {
    async limit(identifier: string): Promise<RateLimitResult> {
      const now = Date.now();
      const entry = store.get(identifier);

      if (!entry || entry.resetAt < now) {
        store.set(identifier, { count: 1, resetAt: now + windowMs });
        return { success: true, limit: maxRequests, remaining: maxRequests - 1, reset: now + windowMs };
      }

      entry.count++;
      const remaining = Math.max(0, maxRequests - entry.count);
      const success = entry.count <= maxRequests;

      if (!success) {
        logger.warn('Rate limit 초과', { identifier, count: entry.count, limit: maxRequests });
      }

      return { success, limit: maxRequests, remaining, reset: entry.resetAt };
    },
  };
}

// ============================================================================
// Upstash Rate Limiter
// ============================================================================

async function createUpstashRateLimiter(
  maxRequests: number,
  windowStr: string,
): Promise<RateLimiter> {
  const { Ratelimit } = await import('@upstash/ratelimit');
  const { Redis } = await import('@upstash/redis');

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxRequests, windowStr as `${number} ${'s' | 'ms' | 'm' | 'h' | 'd'}`),
    analytics: true,
  });

  return {
    async limit(identifier: string): Promise<RateLimitResult> {
      const result = await ratelimit.limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    },
  };
}

// ============================================================================
// 사전 정의된 Rate Limiters
// ============================================================================

let _apiLimiter: RateLimiter | null = null;
let _authLimiter: RateLimiter | null = null;
let _publicLimiter: RateLimiter | null = null;

function hasUpstash(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/** 일반 API: 60 req / 1분 */
export async function getApiLimiter(): Promise<RateLimiter> {
  if (!_apiLimiter) {
    _apiLimiter = hasUpstash()
      ? await createUpstashRateLimiter(60, '1 m')
      : createMemoryRateLimiter(60, 60_000);
  }
  return _apiLimiter;
}

/** 인증 API: 5 req / 15분 */
export async function getAuthLimiter(): Promise<RateLimiter> {
  if (!_authLimiter) {
    _authLimiter = hasUpstash()
      ? await createUpstashRateLimiter(5, '15 m')
      : createMemoryRateLimiter(5, 900_000);
  }
  return _authLimiter;
}

/** 공개 API (verify/inquiry): 20 req / 1분 */
export async function getPublicLimiter(): Promise<RateLimiter> {
  if (!_publicLimiter) {
    _publicLimiter = hasUpstash()
      ? await createUpstashRateLimiter(20, '1 m')
      : createMemoryRateLimiter(20, 60_000);
  }
  return _publicLimiter;
}

// ============================================================================
// 헬퍼
// ============================================================================

/**
 * IP 기반 식별자 추출
 */
export function getClientIp(request: Request): string {
  const forwarded = (request.headers as Headers).get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  const real = (request.headers as Headers).get('x-real-ip');
  if (real) return real;
  return '127.0.0.1';
}

/**
 * Rate limit 응답 헤더 세팅
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.reset),
  };
}
