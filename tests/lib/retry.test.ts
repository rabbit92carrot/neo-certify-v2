import { describe, it, expect, vi } from 'vitest';
import { withRetry } from '@/lib/retry';

// Mock logger
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('withRetry', () => {
  it('성공 시 즉시 반환', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, { maxRetries: 3, baseDelayMs: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('실패 후 재시도하여 성공', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'))
      .mockResolvedValue('ok');

    const result = await withRetry(fn, {
      maxRetries: 3,
      baseDelayMs: 1,
      maxDelayMs: 10,
      context: 'test',
    });

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('maxRetries 초과 시 마지막 에러 throw', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fail'));

    await expect(
      withRetry(fn, { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 5 }),
    ).rejects.toThrow('always fail');

    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('shouldRetry가 false 반환 시 즉시 중단', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('non-retryable'));

    await expect(
      withRetry(fn, {
        maxRetries: 3,
        baseDelayMs: 1,
        shouldRetry: () => false,
      }),
    ).rejects.toThrow('non-retryable');

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('지수 백오프 지연 적용 확인', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok');

    const start = Date.now();
    await withRetry(fn, { maxRetries: 1, baseDelayMs: 50, maxDelayMs: 200 });
    const elapsed = Date.now() - start;

    // 최소 50ms (baseDelay * 2^0 = 50), jitter 포함하여 여유
    expect(elapsed).toBeGreaterThanOrEqual(40);
  });
});
