import type { OrganizationType } from './organization';

export type IconName =
  | 'LayoutDashboard'
  | 'Package'
  | 'Factory'
  | 'Truck'
  | 'History'
  | 'Warehouse'
  | 'FileText'
  | 'Settings'
  | 'Stethoscope'
  | 'Building2'
  | 'UserCheck'
  | 'AlertCircle'
  | 'Bell'
  | 'Mail'
  | 'Trash2';

export interface NavigationItem {
  label: string;
  mobileLabel?: string;
  href: string;
  icon: IconName;
  children?: NavigationItem[];
}

export const MANUFACTURER_NAV_ITEMS: NavigationItem[] = [
  { label: '대시보드', href: '/manufacturer/dashboard', icon: 'LayoutDashboard' },
  { label: '제품 관리', mobileLabel: '제품관리', href: '/manufacturer/products', icon: 'Package' },
  { label: '생산 등록', mobileLabel: '생산등록', href: '/manufacturer/production', icon: 'Factory' },
  { label: '출고', href: '/manufacturer/shipment', icon: 'Truck' },
  { label: '재고 조회', mobileLabel: '재고조회', href: '/manufacturer/inventory', icon: 'Warehouse' },
  { label: '거래 이력', mobileLabel: '거래이력', href: '/manufacturer/history', icon: 'FileText' },
  { label: '알림 보관함', mobileLabel: '알림', href: '/manufacturer/inbox', icon: 'Mail' },
  { label: '환경 설정', mobileLabel: '환경설정', href: '/manufacturer/settings', icon: 'Settings' },
];

export const DISTRIBUTOR_NAV_ITEMS: NavigationItem[] = [
  { label: '대시보드', href: '/distributor/dashboard', icon: 'LayoutDashboard' },
  { label: '출고', href: '/distributor/shipment', icon: 'Truck' },
  { label: '재고 조회', mobileLabel: '재고조회', href: '/distributor/inventory', icon: 'Warehouse' },
  { label: '거래 이력', mobileLabel: '거래이력', href: '/distributor/history', icon: 'FileText' },
];

export const HOSPITAL_NAV_ITEMS: NavigationItem[] = [
  { label: '대시보드', href: '/hospital/dashboard', icon: 'LayoutDashboard' },
  { label: '시술 등록', mobileLabel: '시술등록', href: '/hospital/treatment', icon: 'Stethoscope' },
  { label: '시술 이력', mobileLabel: '시술이력', href: '/hospital/treatment-history', icon: 'History' },
  { label: '폐기 등록', mobileLabel: '폐기등록', href: '/hospital/disposal', icon: 'Trash2' },
  { label: '재고 조회', mobileLabel: '재고조회', href: '/hospital/inventory', icon: 'Warehouse' },
  { label: '거래 이력', mobileLabel: '거래이력', href: '/hospital/history', icon: 'FileText' },
  { label: '제품 관리', mobileLabel: '제품관리', href: '/hospital/settings', icon: 'Settings' },
];

export const ADMIN_NAV_ITEMS: NavigationItem[] = [
  { label: '대시보드', href: '/admin/dashboard', icon: 'LayoutDashboard' },
  { label: '조직 관리', mobileLabel: '조직관리', href: '/admin/organizations', icon: 'Building2' },
  { label: '가입 승인', mobileLabel: '가입승인', href: '/admin/approvals', icon: 'UserCheck' },
  { label: '전체 이력', mobileLabel: '전체이력', href: '/admin/history', icon: 'FileText' },
  { label: '회수 이력', mobileLabel: '회수이력', href: '/admin/recalls', icon: 'AlertCircle' },
  { label: '제품 사용 알림', mobileLabel: '사용알림', href: '/admin/alerts', icon: 'Bell' },
  { label: '알림 보관함', mobileLabel: '알림', href: '/admin/inbox', icon: 'Mail' },
];

const NAVIGATION_ITEMS: Record<OrganizationType, NavigationItem[]> = {
  MANUFACTURER: MANUFACTURER_NAV_ITEMS,
  DISTRIBUTOR: DISTRIBUTOR_NAV_ITEMS,
  HOSPITAL: HOSPITAL_NAV_ITEMS,
  ADMIN: ADMIN_NAV_ITEMS,
};

export function getNavigationItems(orgType: OrganizationType): NavigationItem[] {
  return NAVIGATION_ITEMS[orgType] ?? [];
}
