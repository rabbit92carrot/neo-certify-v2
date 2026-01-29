import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Ensure no Upstash env so memory fallback is used
beforeEach(() => {
  vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

// Mock logger
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('Rate Limiter (메모리 폴백)', () => {
  it('제한 이내 요청 허용', async () => {
    const { getApiLimiter } = await import('@/lib/security/rate-limit');
    const limiter = await getApiLimiter();
    const result = await limiter.limit('test-ip-1');
    expect(result.success).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it('제한 초과 시 차단', async () => {
    const { getAuthLimiter } = await import('@/lib/security/rate-limit');
    const limiter = await getAuthLimiter(); // 5 req / 15min
    const ip = 'test-ip-overflow-' + Date.now();

    // 5 허용
    for (let i = 0; i < 5; i++) {
      const r = await limiter.limit(ip);
      expect(r.success).toBe(true);
    }

    // 6번째 차단
    const blocked = await limiter.limit(ip);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('다른 식별자는 독립적', async () => {
    const { getAuthLimiter } = await import('@/lib/security/rate-limit');
    const limiter = await getAuthLimiter();
    const ts = Date.now();

    // ip-a를 5회 소진
    for (let i = 0; i < 5; i++) {
      await limiter.limit(`ip-a-${ts}`);
    }

    // ip-b는 여전히 가능
    const result = await limiter.limit(`ip-b-${ts}`);
    expect(result.success).toBe(true);
  });
});

describe('getClientIp', () => {
  it('x-forwarded-for 헤더에서 첫 번째 IP 추출', async () => {
    const { getClientIp } = await import('@/lib/security/rate-limit');
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('x-real-ip 폴백', async () => {
    const { getClientIp } = await import('@/lib/security/rate-limit');
    const req = new Request('http://localhost', {
      headers: { 'x-real-ip': '10.0.0.1' },
    });
    expect(getClientIp(req)).toBe('10.0.0.1');
  });

  it('헤더 없으면 127.0.0.1', async () => {
    const { getClientIp } = await import('@/lib/security/rate-limit');
    const req = new Request('http://localhost');
    expect(getClientIp(req)).toBe('127.0.0.1');
  });
});
