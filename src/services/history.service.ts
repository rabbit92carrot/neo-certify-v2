/**
 * 이력 조회 서비스 — 커서 기반 페이지네이션
 * v2: from_org_id/to_org_id/from_patient_id/to_patient_id 기반
 */

import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import { maskPhoneNumber, toStartOfDayKST, toEndOfDayKST } from '@/lib/utils';
import { getActionTypeLabel } from '@/constants';
import type { ApiResponse, ActionType } from '@/types/api.types';
import {
  createErrorResponse,
  createSuccessResponse,
  createOrganizationNameCache,
  getOrganizationName,
} from './common.service';

const logger = createLogger('history.service');

// ============================================================================
// Types
// ============================================================================

export interface TransactionHistorySummary {
  id: string;
  actionType: ActionType;
  actionTypeLabel: string;
  createdAt: string;
  isRecall: boolean;
  recallReason?: string;
  fromOwner?: { type: 'ORGANIZATION' | 'PATIENT'; id: string; name: string };
  toOwner?: { type: 'ORGANIZATION' | 'PATIENT'; id: string; name: string };
  items: {
    productId: string;
    productName: string;
    quantity: number;
  }[];
  totalQuantity: number;
  shipmentBatchId?: string;
}

export interface CursorPaginationMeta {
  hasMore: boolean;
  limit: number;
  nextCursorTime?: string;
  nextCursorKey?: string;
}

export interface CursorPaginatedHistory {
  items: TransactionHistorySummary[];
  meta: CursorPaginationMeta;
}

export interface HistoryCursorQuery {
  actionTypes?: ActionType[];
  startDate?: string;
  endDate?: string;
  isRecall?: boolean;
  limit?: number;
  cursorTime?: string;
  cursorKey?: string;
}

// Role-specific action type sets
const MANUFACTURER_ACTIONS: ActionType[] = ['MANUFACTURED', 'SHIPPED', 'RETURNED'];
const DISTRIBUTOR_ACTIONS: ActionType[] = ['RECEIVED', 'SHIPPED', 'RETURNED'];
const HOSPITAL_ACTIONS: ActionType[] = ['RECEIVED', 'TREATED', 'DISPOSED', 'RETURNED', 'RECALL_TREATED'];

const DEFAULT_LIMIT = 50;

// ============================================================================
// Core: cursor-based history query
// ============================================================================

export async function getTransactionHistoryCursor(
  organizationId: string,
  query: HistoryCursorQuery
): Promise<ApiResponse<CursorPaginatedHistory>> {
  const supabase = await createClient();
  const {
    actionTypes,
    startDate,
    endDate,
    isRecall,
    limit = DEFAULT_LIMIT,
    cursorTime,
    cursorKey: _cursorKey,
  } = query;

  // Build direct query on histories table
  let qb = supabase
    .from('histories')
    .select(`
      id, action_type, created_at, is_recall, recall_reason,
      from_org_id, to_org_id, from_patient_id, to_patient_id,
      shipment_batch_id, treatment_id, disposal_id,
      virtual_code:virtual_codes!inner(
        id, code,
        lot:lots!inner(
          product:products!inner(id, name)
        )
      )
    `)
    .or(`from_org_id.eq.${organizationId},to_org_id.eq.${organizationId}`)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1); // +1 for hasMore check

  if (actionTypes && actionTypes.length > 0) {
    qb = qb.in('action_type', actionTypes);
  }
  if (startDate) qb = qb.gte('created_at', toStartOfDayKST(startDate));
  if (endDate) qb = qb.lte('created_at', toEndOfDayKST(endDate));
  if (isRecall !== undefined) qb = qb.eq('is_recall', isRecall);
  if (cursorTime) qb = qb.lt('created_at', cursorTime);

  const { data, error } = await qb;
  if (error) {
    logger.error('이력 조회 실패', error);
    return createErrorResponse('QUERY_ERROR', '이력 조회에 실패했습니다.');
  }

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  // Resolve org names
  const nameCache = createOrganizationNameCache();
  const summaries: TransactionHistorySummary[] = [];

  // Group by (action_type + created_at + from/to) for batch grouping
  const grouped = new Map<string, typeof items>();
  for (const row of items) {
    const groupKey = `${row.action_type}|${row.created_at}|${row.from_org_id ?? ''}|${row.to_org_id ?? ''}|${row.shipment_batch_id ?? row.treatment_id ?? row.disposal_id ?? ''}`;
    if (!grouped.has(groupKey)) grouped.set(groupKey, []);
    grouped.get(groupKey)!.push(row);
  }

  for (const [_key, groupRows] of grouped) {
    const first = groupRows[0];
    if (!first) continue;
    const actionType = first.action_type as ActionType;

    // Resolve owners
    let fromOwner: TransactionHistorySummary['fromOwner'];
    let toOwner: TransactionHistorySummary['toOwner'];

    if (first.from_org_id) {
      const name = await getOrganizationName(supabase, first.from_org_id, nameCache);
      fromOwner = { type: 'ORGANIZATION', id: first.from_org_id, name };
    } else if (first.from_patient_id) {
      // Look up patient phone for display
      const { data: patient } = await supabase
        .from('patients')
        .select('phone_number')
        .eq('id', first.from_patient_id)
        .single();
      fromOwner = {
        type: 'PATIENT',
        id: first.from_patient_id,
        name: patient ? maskPhoneNumber(patient.phone_number) : '환자',
      };
    }

    if (first.to_org_id) {
      const name = await getOrganizationName(supabase, first.to_org_id, nameCache);
      toOwner = { type: 'ORGANIZATION', id: first.to_org_id, name };
    } else if (first.to_patient_id) {
      const { data: patient } = await supabase
        .from('patients')
        .select('phone_number')
        .eq('id', first.to_patient_id)
        .single();
      toOwner = {
        type: 'PATIENT',
        id: first.to_patient_id,
        name: patient ? maskPhoneNumber(patient.phone_number) : '환자',
      };
    }

    // Aggregate products
    const productMap = new Map<string, { productName: string; quantity: number }>();
    for (const row of groupRows) {
      const vc = row.virtual_code as unknown as {
        id: string;
        code: string;
        lot: { product: { id: string; name: string } };
      };
      const p = vc.lot.product;
      const existing = productMap.get(p.id);
      if (existing) {
        existing.quantity++;
      } else {
        productMap.set(p.id, { productName: p.name, quantity: 1 });
      }
    }

    const productItems = Array.from(productMap.entries()).map(([productId, info]) => ({
      productId,
      productName: info.productName,
      quantity: info.quantity,
    }));

    summaries.push({
      id: first.id,
      actionType,
      actionTypeLabel: getActionTypeLabel(actionType),
      createdAt: first.created_at,
      isRecall: first.is_recall ?? false,
      recallReason: first.recall_reason ?? undefined,
      fromOwner,
      toOwner,
      items: productItems,
      totalQuantity: productItems.reduce((s, i) => s + i.quantity, 0),
      shipmentBatchId: first.shipment_batch_id ?? undefined,
    });
  }

  const lastItem = items[items.length - 1];

  return createSuccessResponse({
    items: summaries,
    meta: {
      hasMore,
      limit,
      nextCursorTime: hasMore && lastItem ? lastItem.created_at : undefined,
      nextCursorKey: hasMore && lastItem ? lastItem.id : undefined,
    },
  });
}

// ============================================================================
// Role-specific wrappers
// ============================================================================

export async function getManufacturerHistoryCursor(
  organizationId: string,
  query: HistoryCursorQuery
): Promise<ApiResponse<CursorPaginatedHistory>> {
  return getTransactionHistoryCursor(organizationId, {
    ...query,
    actionTypes: query.actionTypes?.length
      ? query.actionTypes.filter((t) => MANUFACTURER_ACTIONS.includes(t))
      : MANUFACTURER_ACTIONS,
  });
}

export async function getDistributorHistoryCursor(
  organizationId: string,
  query: HistoryCursorQuery
): Promise<ApiResponse<CursorPaginatedHistory>> {
  return getTransactionHistoryCursor(organizationId, {
    ...query,
    actionTypes: query.actionTypes?.length
      ? query.actionTypes.filter((t) => DISTRIBUTOR_ACTIONS.includes(t))
      : DISTRIBUTOR_ACTIONS,
  });
}

export async function getHospitalHistoryCursor(
  organizationId: string,
  query: HistoryCursorQuery
): Promise<ApiResponse<CursorPaginatedHistory>> {
  return getTransactionHistoryCursor(organizationId, {
    ...query,
    actionTypes: query.actionTypes?.length
      ? query.actionTypes.filter((t) => HOSPITAL_ACTIONS.includes(t))
      : HOSPITAL_ACTIONS,
  });
}
