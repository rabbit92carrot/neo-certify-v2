export const ORGANIZATION_TYPES = {
  MANUFACTURER: 'MANUFACTURER',
  DISTRIBUTOR: 'DISTRIBUTOR',
  HOSPITAL: 'HOSPITAL',
  ADMIN: 'ADMIN',
} as const;

export type OrganizationType = (typeof ORGANIZATION_TYPES)[keyof typeof ORGANIZATION_TYPES];

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  MANUFACTURER: '제조사',
  DISTRIBUTOR: '유통사',
  HOSPITAL: '병원',
  ADMIN: '관리자',
};

export const ORGANIZATION_STATUSES = {
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  DELETED: 'DELETED',
} as const;

export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[keyof typeof ORGANIZATION_STATUSES];

export const ORGANIZATION_STATUS_LABELS: Record<OrganizationStatus, string> = {
  PENDING_APPROVAL: '승인 대기',
  ACTIVE: '활성',
  INACTIVE: '비활성',
  DELETED: '삭제됨',
};
