/**
 * Shipment Service — FIFO 출고 로직 단위 테스트
 *
 * 실제 Supabase RPC를 모킹하여 서비스 레이어 로직만 검증
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase — deep chaining
const mockRpc = vi.fn();

function createChainMock(resolvedValue: unknown = { data: null, error: null }) {
  const chain: Record<string, unknown> = {};
  const handler = (): typeof chain => chain;
  chain.select = vi.fn(handler);
  chain.eq = vi.fn(handler);
  chain.neq = vi.fn(handler);
  chain.in = vi.fn(handler);
  chain.order = vi.fn().mockResolvedValue(resolvedValue);
  chain.single = vi.fn().mockResolvedValue(resolvedValue);
  chain.range = vi.fn().mockResolvedValue(resolvedValue);
  return chain;
}

let mockChain = createChainMock();
const mockFrom = vi.fn(() => mockChain);

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    rpc: mockRpc,
    from: mockFrom,
  }),
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('Shipment Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getShipmentTargetOrganizations', () => {
    it('제조사/유통사는 유통사+병원 대상 조회', async () => {
      mockChain = createChainMock();
      mockChain.order = vi.fn().mockResolvedValue({
        data: [
          { id: '1', name: '유통사A', type: 'DISTRIBUTOR' },
          { id: '2', name: '병원B', type: 'HOSPITAL' },
        ],
        error: null,
      });

      const { getShipmentTargetOrganizations } = await import('@/services/shipment.service');
      const result = await getShipmentTargetOrganizations('MANUFACTURER', 'exclude-id');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it('병원은 빈 배열 반환 (출고 대상 없음)', async () => {
      const { getShipmentTargetOrganizations } = await import('@/services/shipment.service');
      const result = await getShipmentTargetOrganizations('HOSPITAL');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe('createShipment (FIFO)', () => {
    it('RPC 성공 시 배치 ID 반환', async () => {
      // from('organizations').select('type').eq().single() → org type
      mockChain = createChainMock();
      mockChain.single = vi.fn().mockResolvedValue({
        data: { type: 'HOSPITAL' },
        error: null,
      });

      mockRpc.mockResolvedValue({
        data: [{
          shipment_batch_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          total_quantity: 50,
          error_code: null,
          error_message: null,
        }],
        error: null,
      });

      const { createShipment } = await import('@/services/shipment.service');
      const result = await createShipment({
        toOrganizationId: 'target-org-uuid',
        items: [{ productId: 'prod-uuid', quantity: 50 }],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.shipmentBatchId).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
        expect(result.data.totalQuantity).toBe(50);
      }
    });

    it('RPC 에러 코드 반환 시 실패', async () => {
      mockChain = createChainMock();
      mockChain.single = vi.fn().mockResolvedValue({
        data: { type: 'HOSPITAL' },
        error: null,
      });

      mockRpc.mockResolvedValue({
        data: [{
          shipment_batch_id: null,
          total_quantity: 0,
          error_code: 'INSUFFICIENT_STOCK',
          error_message: '재고 부족',
        }],
        error: null,
      });

      const { createShipment } = await import('@/services/shipment.service');
      const result = await createShipment({
        toOrganizationId: 'target-org-uuid',
        items: [{ productId: 'prod-uuid', quantity: 9999 }],
      });

      expect(result.success).toBe(false);
    });
  });
});
