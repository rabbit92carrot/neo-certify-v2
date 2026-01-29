import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateHmac,
  verifyHmac,
  verifyHmacWithRotation,
  generateSecretKey,
  signVirtualCode,
  verifySignedVirtualCode,
} from '@/lib/security/hmac';

const TEST_SECRET = 'test-secret-key-32bytes-longenough';
const TEST_PREVIOUS_SECRET = 'old-secret-key-for-rotation-test';

describe('HMAC 유틸리티', () => {
  beforeEach(() => {
    vi.stubEnv('HMAC_SECRET_KEY', TEST_SECRET);
    vi.stubEnv('HMAC_SECRET_KEY_PREVIOUS', TEST_PREVIOUS_SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('generateHmac', () => {
    it('동일 데이터 + 동일 키 → 동일 결과', () => {
      const sig1 = generateHmac('hello', TEST_SECRET);
      const sig2 = generateHmac('hello', TEST_SECRET);
      expect(sig1).toBe(sig2);
    });

    it('다른 데이터 → 다른 결과', () => {
      const sig1 = generateHmac('hello', TEST_SECRET);
      const sig2 = generateHmac('world', TEST_SECRET);
      expect(sig1).not.toBe(sig2);
    });

    it('hex 문자열 반환', () => {
      const sig = generateHmac('test', TEST_SECRET);
      expect(sig).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('verifyHmac', () => {
    it('올바른 서명 검증 성공', () => {
      const sig = generateHmac('data', TEST_SECRET);
      expect(verifyHmac('data', sig, TEST_SECRET)).toBe(true);
    });

    it('잘못된 서명 검증 실패', () => {
      expect(verifyHmac('data', 'invalid-sig', TEST_SECRET)).toBe(false);
    });

    it('변조된 데이터 검증 실패', () => {
      const sig = generateHmac('original', TEST_SECRET);
      expect(verifyHmac('tampered', sig, TEST_SECRET)).toBe(false);
    });
  });

  describe('verifyHmacWithRotation', () => {
    it('현재 키로 서명된 데이터 검증', () => {
      const sig = generateHmac('data', TEST_SECRET);
      expect(verifyHmacWithRotation('data', sig)).toBe(true);
    });

    it('이전 키로 서명된 데이터도 검증 (로테이션)', () => {
      const sig = generateHmac('data', TEST_PREVIOUS_SECRET);
      expect(verifyHmacWithRotation('data', sig)).toBe(true);
    });

    it('어떤 키로도 안 되는 서명은 실패', () => {
      const sig = generateHmac('data', 'unknown-key');
      expect(verifyHmacWithRotation('data', sig)).toBe(false);
    });
  });

  describe('generateSecretKey', () => {
    it('기본 32바이트 = 64자 hex', () => {
      const key = generateSecretKey();
      expect(key).toMatch(/^[0-9a-f]{64}$/);
    });

    it('매번 다른 키 생성', () => {
      expect(generateSecretKey()).not.toBe(generateSecretKey());
    });
  });

  describe('signVirtualCode / verifySignedVirtualCode', () => {
    it('서명 → 검증 성공', () => {
      const signed = signVirtualCode('VC-TEST123');
      const { valid, code } = verifySignedVirtualCode(signed);
      expect(valid).toBe(true);
      expect(code).toBe('VC-TEST123');
    });

    it('변조된 코드 검증 실패', () => {
      const signed = signVirtualCode('VC-TEST123');
      const tampered = 'VC-TAMPERED' + signed.slice(signed.lastIndexOf('.'));
      const { valid } = verifySignedVirtualCode(tampered);
      expect(valid).toBe(false);
    });

    it('구분자 없는 문자열 실패', () => {
      const { valid, code } = verifySignedVirtualCode('noseparator');
      expect(valid).toBe(false);
      expect(code).toBe('');
    });
  });
});
