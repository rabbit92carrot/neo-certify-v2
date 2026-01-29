/**
 * API 요청/응답 타입 정의
 */

import type { Tables, Enums } from './database.types';

// ============================================================================
// 표준 API 응답 타입
// ============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export type ApiPaginatedResponse<T> = ApiResponse<PaginatedResponse<T>>;

// ============================================================================
// 커서 기반 페이지네이션
// ============================================================================

export interface CursorPaginationParams {
  limit?: number;
  cursorTime?: string;
  cursorKey?: string;
}

export interface CursorPaginationMeta {
  limit: number;
  hasMore: boolean;
  nextCursorTime?: string;
  nextCursorKey?: string;
}

export interface CursorPaginatedResponse<T> {
  items: T[];
  meta: CursorPaginationMeta;
}

// ============================================================================
// 공통 요청 타입
// ============================================================================

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export interface IdParam {
  id: string;
}

// ============================================================================
// 엔티티 타입 별칭
// ============================================================================

export type Organization = Tables<'organizations'>;
export type ManufacturerSettings = Tables<'manufacturer_settings'>;
export type Product = Tables<'products'>;
export type Lot = Tables<'lots'>;
export type Patient = Tables<'patients'>;
export type VirtualCode = Tables<'virtual_codes'>;
export type ShipmentBatch = Tables<'shipment_batches'>;
export type ShipmentDetail = Tables<'shipment_details'>;
export type TreatmentRecord = Tables<'treatment_records'>;
export type TreatmentDetail = Tables<'treatment_details'>;
export type History = Tables<'histories'>;
export type NotificationMessage = Tables<'notification_messages'>;
export type DisposalRecord = Tables<'disposal_records'>;
export type DisposalDetail = Tables<'disposal_details'>;
export type OrganizationAlert = Tables<'organization_alerts'>;
export type HospitalKnownProduct = Tables<'hospital_known_products'>;
export type HospitalKnownPatient = Tables<'hospital_known_patients'>;

// ============================================================================
// Enum 타입 별칭
// ============================================================================

export type OrgType = Enums<'org_type'>;
export type OrgStatus = Enums<'org_status'>;
export type CodeStatus = Enums<'code_status'>;
export type ActionType = Enums<'action_type'>;
export type DeactivationReasonType = Enums<'deactivation_reason_type'>;
export type DisposalReason = Enums<'disposal_reason'>;

// ============================================================================
// 인증 관련 타입
// ============================================================================

export interface CurrentUser {
  id: string;
  email: string;
  organization: Organization;
  manufacturerSettings?: ManufacturerSettings;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
  };
  organization: Organization;
}

// ============================================================================
// 조인된 엔티티 타입
// ============================================================================

export interface ProductWithLots extends Product {
  lots: Lot[];
}

export interface LotWithProduct extends Lot {
  product: Product;
}

export interface VirtualCodeWithDetails extends VirtualCode {
  lot: LotWithProduct;
}

// ============================================================================
// 대시보드 통계
// ============================================================================

export interface DashboardStats {
  totalInventory: number;
  todayShipments: number;
}

export interface ManufacturerDashboardStats extends DashboardStats {
  todayProduction: number;
  activeProducts: number;
}

export interface DistributorDashboardStats extends DashboardStats {
  todayReceived: number;
}

export interface HospitalDashboardStats extends DashboardStats {
  todayTreatments: number;
  totalPatients: number;
}

export interface AdminDashboardStats {
  totalOrganizations: number;
  pendingApprovals: number;
  todayRecalls: number;
  totalVirtualCodes: number;
}
