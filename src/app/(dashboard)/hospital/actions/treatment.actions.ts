'use server';

/**
 * 병원 시술 관련 Server Actions
 */

import { revalidatePath } from 'next/cache';
import { AuthService } from '@/services/auth.service';
import * as treatmentService from '@/services/treatment.service';
import { treatmentCreateSchema, treatmentRecallSchema } from '@/schemas/treatment';
import type { ApiResponse } from '@/types/api.types';
import { formatZodErrors } from '@/lib/utils';
import { createErrorResponse } from '@/services/common.service';

async function requireHospital(): Promise<string | ApiResponse<never>> {
  const user = await AuthService.getCurrentUser();
  if (!user.success || user.data!.organization.type !== 'HOSPITAL') {
    return createErrorResponse('UNAUTHORIZED', '병원 계정이 필요합니다.');
  }
  return user.data!.organization.id;
}

/**
 * 시술 등록
 */
export async function createTreatmentAction(
  data: {
    patientPhone: string;
    treatmentDate: string;
    items: { productId: string; quantity: number }[];
  }
): Promise<ApiResponse<{ treatmentId: string; totalQuantity: number }>> {
  const orgId = await requireHospital();
  if (typeof orgId !== 'string') return orgId;

  const v = treatmentCreateSchema.safeParse(data);
  if (!v.success) return createErrorResponse('VALIDATION_ERROR', '입력값 확인', formatZodErrors(v.error));

  const result = await treatmentService.createTreatment(v.data);
  if (result.success) {
    revalidatePath('/hospital/treatment');
    revalidatePath('/hospital/dashboard');
  }
  return result;
}

/**
 * 시술 회수 (24h 제한)
 */
export async function recallTreatmentAction(
  treatmentId: string,
  reason: string
): Promise<ApiResponse<void>> {
  const orgId = await requireHospital();
  if (typeof orgId !== 'string') return orgId;

  const v = treatmentRecallSchema.safeParse({ treatmentId, reason });
  if (!v.success) return createErrorResponse('VALIDATION_ERROR', '입력값 확인', formatZodErrors(v.error));

  const result = await treatmentService.recallTreatment(v.data.treatmentId, v.data.reason);
  if (result.success) revalidatePath('/hospital/treatment');
  return result;
}

/**
 * 시술 이력 조회
 */
export async function getTreatmentHistoryAction(query?: {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  patientPhone?: string;
}) {
  const orgId = await requireHospital();
  if (typeof orgId !== 'string') return orgId;
  return treatmentService.getTreatmentHistory(orgId, query ?? {});
}

/**
 * 환자 검색
 */
export async function searchPatientsAction(searchTerm?: string) {
  const orgId = await requireHospital();
  if (typeof orgId !== 'string') return orgId;
  return treatmentService.getHospitalPatients(orgId, searchTerm);
}
