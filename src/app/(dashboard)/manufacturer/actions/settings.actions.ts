'use server';

/**
 * 제조사 설정 Server Actions
 */

import { revalidatePath } from 'next/cache';
import { AuthService } from '@/services/auth.service';
import { createClient } from '@/lib/supabase/server';
import { manufacturerSettingsUpdateSchema } from '@/schemas/organization';
import type { ApiResponse, ManufacturerSettings } from '@/types/api.types';
import { createErrorResponse, createSuccessResponse } from '@/services/common.service';
import { formatZodErrors } from '@/lib/utils';

async function requireManufacturer(): Promise<string | ApiResponse<never>> {
  const user = await AuthService.getCurrentUser();
  if (!user.success || user.data!.organization.type !== 'MANUFACTURER') {
    return createErrorResponse('UNAUTHORIZED', '제조사 계정이 필요합니다.');
  }
  return user.data!.organization.id;
}

export async function getSettingsAction(): Promise<ApiResponse<ManufacturerSettings | null>> {
  const orgId = await requireManufacturer();
  if (typeof orgId !== 'string') return orgId;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('manufacturer_settings')
    .select('*')
    .eq('organization_id', orgId)
    .single();

  if (error) return createSuccessResponse(null);
  return createSuccessResponse(data);
}

export async function updateSettingsAction(
  formData: FormData
): Promise<ApiResponse<void>> {
  const orgId = await requireManufacturer();
  if (typeof orgId !== 'string') return orgId;

  const raw = {
    hmacSecret: (formData.get('hmacSecret') as string) || undefined,
    codePrefix: (formData.get('codePrefix') as string) || undefined,
  };

  const v = manufacturerSettingsUpdateSchema.safeParse(raw);
  if (!v.success) return createErrorResponse('VALIDATION_ERROR', '입력값을 확인해주세요.', formatZodErrors(v.error));

  const supabase = await createClient();
  const updateData: Record<string, unknown> = {};
  if (v.data.hmacSecret) updateData.hmac_secret = v.data.hmacSecret;
  if (v.data.codePrefix !== undefined) updateData.code_prefix = v.data.codePrefix;

  const { error } = await supabase
    .from('manufacturer_settings')
    .update(updateData)
    .eq('organization_id', orgId);

  if (error) return createErrorResponse('UPDATE_FAILED', '설정 업데이트에 실패했습니다.');

  revalidatePath('/manufacturer/settings');
  return createSuccessResponse(undefined);
}
