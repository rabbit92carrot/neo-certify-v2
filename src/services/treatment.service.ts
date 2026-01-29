/**
 * 시술 서비스 — 시술 등록, 조회, 24h 회수
 * v2: process_treatment, recall_treatment RPC
 */

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import { getHoursDifference } from '@/lib/utils';
import type { ApiResponse, PaginatedResponse, TreatmentRecord } from '@/types/api.types';
import type { TreatmentCreateData } from '@/schemas/treatment';
import type { Json } from '@/types/database.types';
import { normalizePhoneNumber } from '@/schemas/common';
import { createErrorResponse, createSuccessResponse, parseRpcSingle } from './common.service';

const logger = createLogger('treatment.service');

// ============================================================================
// RPC schemas
// ============================================================================

const TreatmentResultSchema = z.object({
  treatment_id: z.string().uuid().nullable(),
  total_quantity: z.number(),
  error_code: z.string().nullable(),
  error_message: z.string().nullable(),
});

const RecallTreatmentResultSchema = z.object({
  success: z.boolean(),
  recalled_count: z.number(),
  error_code: z.string().nullable(),
  error_message: z.string().nullable(),
});

// ============================================================================
// Types
// ============================================================================

export interface TreatmentRecordSummary extends TreatmentRecord {
  itemSummary: { productId: string; productName: string; quantity: number }[];
  totalQuantity: number;
  isRecallable: boolean;
}

// ============================================================================
// 시술 생성
// ============================================================================

export async function createTreatment(
  data: TreatmentCreateData
): Promise<ApiResponse<{ treatmentId: string; totalQuantity: number }>> {
  const supabase = await createClient();
  const normalizedPhone = normalizePhoneNumber(data.patientPhone);

  const items = data.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
  }));

  const { data: result, error } = await supabase.rpc('process_treatment', {
    p_patient_phone: normalizedPhone,
    p_treatment_date: data.treatmentDate,
    p_items: items as unknown as Json,
  });

  if (error) {
    logger.error('process_treatment 호출 실패', error);
    return createErrorResponse('TREATMENT_CREATE_FAILED', '시술 생성에 실패했습니다.');
  }

  const parsed = parseRpcSingle(TreatmentResultSchema, result, 'process_treatment');
  if (!parsed.success) return createErrorResponse('VALIDATION_ERROR', parsed.error);

  const row = parsed.data;
  if (row?.error_code) {
    return createErrorResponse(row.error_code, row.error_message ?? '시술 생성에 실패했습니다.');
  }

  return createSuccessResponse({
    treatmentId: row?.treatment_id ?? '',
    totalQuantity: row?.total_quantity ?? 0,
  });
}

// ============================================================================
// 시술 이력 조회
// ============================================================================

export async function getTreatmentHistory(
  hospitalId: string,
  query: {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
    patientPhone?: string;
  }
): Promise<ApiResponse<PaginatedResponse<TreatmentRecordSummary>>> {
  const supabase = await createClient();
  const { page = 1, pageSize = 20, startDate, endDate, patientPhone } = query;
  const offset = (page - 1) * pageSize;

  let qb = supabase
    .from('treatment_records')
    .select('*', { count: 'exact' })
    .eq('hospital_id', hospitalId)
    .order('treatment_date', { ascending: false });

  if (startDate) qb = qb.gte('treatment_date', startDate);
  if (endDate) qb = qb.lte('treatment_date', endDate);
  if (patientPhone) {
    // v2: patient_id based — need to look up patient first
    const normalized = normalizePhoneNumber(patientPhone);
    const { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('phone_number', normalized)
      .single();
    if (patient) {
      qb = qb.eq('patient_id', patient.id);
    } else {
      // No matching patient → empty result
      return createSuccessResponse({
        items: [],
        meta: { page, pageSize, total: 0, totalPages: 0, hasMore: false },
      });
    }
  }

  const { data: records, count, error } = await qb.range(offset, offset + pageSize - 1);
  if (error) {
    logger.error('시술 이력 조회 실패', error);
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  // For each record, get treatment details summary
  const recordIds = (records ?? []).map((r) => r.id);
  const summariesMap = new Map<string, { productId: string; productName: string; quantity: number }[]>();

  if (recordIds.length > 0) {
    const { data: details } = await supabase
      .from('treatment_details')
      .select(`
        treatment_id,
        virtual_code:virtual_codes!inner(
          lot:lots!inner(
            product:products!inner(id, name)
          )
        )
      `)
      .in('treatment_id', recordIds);

    // Aggregate
    for (const d of details ?? []) {
      const vc = d.virtual_code as unknown as { lot: { product: { id: string; name: string } } };
      const p = vc.lot.product;
      if (!summariesMap.has(d.treatment_id)) summariesMap.set(d.treatment_id, []);
      const items = summariesMap.get(d.treatment_id)!;
      const existing = items.find((i) => i.productId === p.id);
      if (existing) {
        existing.quantity++;
      } else {
        items.push({ productId: p.id, productName: p.name, quantity: 1 });
      }
    }
  }

  const summaries: TreatmentRecordSummary[] = (records ?? []).map((rec) => {
    const items = summariesMap.get(rec.id) ?? [];
    return {
      ...rec,
      itemSummary: items,
      totalQuantity: items.reduce((s, i) => s + i.quantity, 0),
      isRecallable: getHoursDifference(rec.created_at) <= 24,
    };
  });

  const total = count ?? 0;
  return createSuccessResponse({
    items: summaries,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize), hasMore: offset + pageSize < total },
  });
}

// ============================================================================
// 시술 회수 (24h 제한)
// ============================================================================

export async function recallTreatment(
  treatmentId: string,
  reason: string
): Promise<ApiResponse<void>> {
  const supabase = await createClient();

  const { data: result, error } = await supabase.rpc('recall_treatment', {
    p_treatment_id: treatmentId,
    p_reason: reason,
  });

  if (error) {
    logger.error('recall_treatment 호출 실패', error);
    return createErrorResponse('RECALL_FAILED', '시술 회수에 실패했습니다.');
  }

  const parsed = parseRpcSingle(RecallTreatmentResultSchema, result, 'recall_treatment');
  if (!parsed.success) return createErrorResponse('VALIDATION_ERROR', parsed.error);

  const row = parsed.data;
  if (!row?.success) {
    return createErrorResponse(
      row?.error_code ?? 'RECALL_FAILED',
      row?.error_message ?? '시술 회수에 실패했습니다.'
    );
  }

  return createSuccessResponse(undefined);
}

// ============================================================================
// 회수 가능 여부 확인
// ============================================================================

export async function checkTreatmentRecallAllowed(
  hospitalId: string,
  treatmentId: string
): Promise<ApiResponse<{ allowed: boolean; reason?: string }>> {
  const supabase = await createClient();
  const { data: treatment, error } = await supabase
    .from('treatment_records')
    .select('hospital_id, created_at')
    .eq('id', treatmentId)
    .single();

  if (error || !treatment)
    return createErrorResponse('TREATMENT_NOT_FOUND', '시술 기록을 찾을 수 없습니다.');
  if (treatment.hospital_id !== hospitalId)
    return createSuccessResponse({ allowed: false, reason: '해당 병원에서만 회수할 수 있습니다.' });
  if (getHoursDifference(treatment.created_at) > 24)
    return createSuccessResponse({ allowed: false, reason: '24시간 경과하여 처리할 수 없습니다.' });

  return createSuccessResponse({ allowed: true });
}

// ============================================================================
// 병원 환자 검색
// ============================================================================

export async function getHospitalPatients(
  hospitalId: string,
  searchTerm?: string,
  limit = 10
): Promise<ApiResponse<string[]>> {
  const supabase = await createClient();

  // v2: hospital_known_patients 테이블 사용
  let qb = supabase
    .from('hospital_known_patients')
    .select('patient:patients!inner(phone_number)')
    .eq('hospital_id', hospitalId)
    .limit(limit);

  if (searchTerm) {
    const normalized = normalizePhoneNumber(searchTerm);
    // Filter on patient phone_number via inner join
    qb = supabase
      .from('hospital_known_patients')
      .select('patient:patients!inner(phone_number)')
      .eq('hospital_id', hospitalId)
      .ilike('patients.phone_number', `%${normalized}%`)
      .limit(limit);
  }

  const { data, error } = await qb;
  if (error) {
    logger.error('환자 검색 실패', error);
    return createErrorResponse('QUERY_ERROR', error.message);
  }

  const phones = (data ?? []).map(
    (row) => (row.patient as unknown as { phone_number: string }).phone_number
  );
  return createSuccessResponse(phones);
}
