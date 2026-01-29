/**
 * Treatment Service — 24h 회수 윈도우 검증
 */
import { describe, it, expect, vi } from 'vitest';
import { getHoursDifference } from '@/lib/utils';

// 실제 utils 함수 직접 테스트 (Supabase 모킹 없이 순수 로직)
describe('24h 회수 윈도우 로직', () => {
  it('1시간 전 시술 → 회수 가능 (24h 이내)', () => {
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
    const hours = getHoursDifference(oneHourAgo);
    expect(hours).toBeLessThan(24);
    expect(hours).toBeGreaterThan(0);
  });

  it('23시간 전 시술 → 회수 가능', () => {
    const twentyThreeHoursAgo = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();
    const hours = getHoursDifference(twentyThreeHoursAgo);
    expect(hours).toBeLessThan(24);
  });

  it('25시간 전 시술 → 회수 불가 (24h 초과)', () => {
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    const hours = getHoursDifference(twentyFiveHoursAgo);
    expect(hours).toBeGreaterThan(24);
  });

  it('방금 시술 → 0에 가까운 시간차', () => {
    const now = new Date().toISOString();
    const hours = getHoursDifference(now);
    expect(hours).toBeLessThan(0.01); // ~36초 이내
  });

  it('48시간 전 → 확실히 초과', () => {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const hours = getHoursDifference(twoDaysAgo);
    expect(hours).toBeGreaterThanOrEqual(47.9);
  });
});

// Treatment service RPC 모킹 테스트
const mockRpc = vi.fn();

function createChainMock(resolvedValue: unknown = { data: null, error: null }) {
  const chain: Record<string, unknown> = {};
  const handler = (): typeof chain => chain;
  chain.select = vi.fn(handler);
  chain.eq = vi.fn(handler);
  chain.neq = vi.fn(handler);
  chain.in = vi.fn(handler);
  chain.order = vi.fn(handler);
  chain.range = vi.fn().mockResolvedValue(resolvedValue);
  chain.single = vi.fn().mockResolvedValue(resolvedValue);
  return chain;
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    rpc: mockRpc,
    from: vi.fn(() => createChainMock()),
  }),
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
  }),
}));

describe('Treatment Service - createTreatment', () => {
  it('RPC 성공 시 시술 ID 반환', async () => {
    mockRpc.mockResolvedValue({
      data: [{
        treatment_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        total_quantity: 3,
        error_code: null,
        error_message: null,
      }],
      error: null,
    });

    const { createTreatment } = await import('@/services/treatment.service');
    const result = await createTreatment({
      patientPhone: '010-1234-5678',
      treatmentDate: '2025-01-15',
      items: [{ productId: 'prod-1', quantity: 3 }],
    });

    expect(result.success).toBe(true);
  });

  it('RPC 실패 시 에러 반환', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'DB error' },
    });

    const { createTreatment } = await import('@/services/treatment.service');
    const result = await createTreatment({
      patientPhone: '010-1234-5678',
      treatmentDate: '2025-01-15',
      items: [{ productId: 'prod-1', quantity: 1 }],
    });

    expect(result.success).toBe(false);
  });
});
