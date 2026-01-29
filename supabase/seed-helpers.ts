/**
 * Seed data generation helpers
 * HMAC code generation and deterministic UUID helpers
 */

import { createHmac } from 'crypto';

/** HMAC secret for seed data (matches seed.sql manufacturer_settings) */
export const SEED_HMAC_SECRET = 'meditech-hmac-secret-key-2024';

/**
 * Generate HMAC-signed virtual code
 * Used for deterministic code generation in tests
 */
export function generateHmacCode(prefix: string, index: number): string {
  const payload = `${prefix}-${index.toString().padStart(4, '0')}`;
  const hmac = createHmac('sha256', SEED_HMAC_SECRET)
    .update(payload)
    .digest('hex')
    .substring(0, 8)
    .toUpperCase();
  return `${payload}-${hmac}`;
}

/**
 * Deterministic UUID generator for seed data
 * Pattern: {prefix}-0000-0000-{section}-{padded index}
 */
export function seedUuid(
  prefix: string,
  section: string,
  index: number
): string {
  const padded = index.toString().padStart(12, '0');
  return `${prefix}-0000-0000-${section}-${padded}`;
}

/** Well-known seed IDs */
export const SEED_IDS = {
  auth: {
    admin: 'a0000000-0000-0000-0000-000000000001',
    manufacturer: 'a0000000-0000-0000-0000-000000000002',
    distributor: 'a0000000-0000-0000-0000-000000000003',
    hospital1: 'a0000000-0000-0000-0000-000000000004',
    hospital2: 'a0000000-0000-0000-0000-000000000005',
  },
  org: {
    admin: 'b0000000-0000-0000-0000-000000000001',
    manufacturer: 'b0000000-0000-0000-0000-000000000002',
    distributor: 'b0000000-0000-0000-0000-000000000003',
    hospital1: 'b0000000-0000-0000-0000-000000000004',
    hospital2: 'b0000000-0000-0000-0000-000000000005',
  },
  products: {
    noseS: 'd0000000-0000-0000-0000-000000000001',
    noseM: 'd0000000-0000-0000-0000-000000000002',
    noseL: 'd0000000-0000-0000-0000-000000000003',
    chin: 'd0000000-0000-0000-0000-000000000004',
    filler05: 'd0000000-0000-0000-0000-000000000005',
    filler10: 'd0000000-0000-0000-0000-000000000006',
    filler20: 'd0000000-0000-0000-0000-000000000007',
  },
  patients: {
    patient1: '10000000-0000-0000-0000-000000000001',
    patient2: '10000000-0000-0000-0000-000000000002',
    patient3: '10000000-0000-0000-0000-000000000003',
    patient4: '10000000-0000-0000-0000-000000000004',
    patient5: '10000000-0000-0000-0000-000000000005',
  },
} as const;

/** Test account credentials */
export const TEST_ACCOUNTS = {
  admin: { email: 'admin@neocert.com', password: 'admin123' },
  manufacturer: { email: 'meditech@neocert.com', password: 'test1234' },
  distributor: { email: 'supply@neocert.com', password: 'test1234' },
  hospital1: { email: 'seoul-ps@neocert.com', password: 'test1234' },
  hospital2: { email: 'gangnam@neocert.com', password: 'test1234' },
} as const;
