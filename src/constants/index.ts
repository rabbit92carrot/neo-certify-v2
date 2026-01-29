/**
 * SSOT constants
 */

export * from './organization';
export * from './navigation';

export const CONFIG = {
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    DEFAULT_CURSOR_LIMIT: 50,
    MAX_PAGE_SIZE: 100,
  },
  RECALL: {
    TIME_LIMIT_HOURS: 24,
  },
  LOT: {
    MAX_QUANTITY: 100000,
  },
  CACHE: {
    PRODUCTS_TTL: 300, // 5min
    TARGET_ORGS_TTL: 600, // 10min
  },
} as const;

export const ACTION_TYPE_LABELS: Record<string, string> = {
  MANUFACTURED: '생산',
  SHIPPED: '출고',
  RECEIVED: '입고',
  TREATED: '시술',
  DISPOSED: '폐기',
  RETURNED: '반품',
  RECALL_TREATED: '시술 회수',
} as const;

export function getActionTypeLabel(actionType: string): string {
  return ACTION_TYPE_LABELS[actionType] ?? actionType;
}
