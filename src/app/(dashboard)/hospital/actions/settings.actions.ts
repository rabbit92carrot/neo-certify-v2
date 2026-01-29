'use server';

/**
 * 병원 설정 Server Actions (제품 별칭 등)
 */

import { revalidatePath } from 'next/cache';
import { AuthService } from '@/services/auth.service';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, HospitalKnownProduct } from '@/types/api.types';
import { createErrorResponse, createSuccessResponse } from '@/services/common.service';

async function requireHospital(): Promise<string | ApiResponse<never>> {
  const user = await AuthService.getCurrentUser();
  if (!user.success || user.data!.organization.type !== 'HOSPITAL') {
    return createErrorResponse('UNAUTHORIZED', '병원 계정이 필요합니다.');
  }
  return user.data!.organization.id;
}

/**
 * 병원 등록 제품 목록 조회
 */
export async function getHospitalProductsAction(): Promise<ApiResponse<HospitalKnownProduct[]>> {
  const orgId = await requireHospital();
  if (typeof orgId !== 'string') return orgId;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('hospital_known_products')
    .select('*')
    .eq('hospital_id', orgId)
    .order('created_at', { ascending: false });

  if (error) return createErrorResponse('QUERY_ERROR', error.message);
  return createSuccessResponse(data ?? []);
}

/**
 * 제품 별칭 설정
 */
export async function setProductAliasAction(
  productId: string,
  alias: string
): Promise<ApiResponse<void>> {
  const orgId = await requireHospital();
  if (typeof orgId !== 'string') return orgId;

  const supabase = await createClient();
  const { error } = await supabase
    .from('hospital_known_products')
    .update({ alias })
    .eq('hospital_id', orgId)
    .eq('product_id', productId);

  if (error) return createErrorResponse('UPDATE_FAILED', '별칭 설정에 실패했습니다.');
  revalidatePath('/hospital/settings');
  return createSuccessResponse(undefined);
}
