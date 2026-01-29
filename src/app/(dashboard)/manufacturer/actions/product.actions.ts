'use server';

/**
 * 제조사 제품 관련 Server Actions
 */

import { revalidatePath } from 'next/cache';
import { AuthService } from '@/services/auth.service';
import * as productService from '@/services/product.service';
import { productCreateSchema, productUpdateSchema } from '@/schemas/product';
import type { ApiResponse } from '@/types/api.types';
import { formatZodErrors } from '@/lib/utils';
import { createErrorResponse } from '@/services/common.service';

async function requireManufacturer(): Promise<string | ApiResponse<never>> {
  const user = await AuthService.getCurrentUser();
  if (!user.success || user.data!.organization.type !== 'MANUFACTURER') {
    return createErrorResponse('UNAUTHORIZED', '제조사 계정으로 로그인이 필요합니다.');
  }
  return user.data!.organization.id;
}

export async function createProductAction(
  formData: FormData
): Promise<ApiResponse<{ id: string }>> {
  const orgId = await requireManufacturer();
  if (typeof orgId !== 'string') return orgId;

  const raw = {
    name: formData.get('name') as string,
    udiDi: formData.get('udiDi') as string,
    modelName: formData.get('modelName') as string,
  };

  const v = productCreateSchema.safeParse(raw);
  if (!v.success) return createErrorResponse('VALIDATION_ERROR', '입력값을 확인해주세요.', formatZodErrors(v.error));

  const result = await productService.createProduct(orgId, v.data);
  if (result.success) {
    revalidatePath('/manufacturer/products');
    return { success: true, data: { id: result.data!.id } };
  }
  return result as ApiResponse<{ id: string }>;
}

export async function updateProductAction(
  productId: string,
  formData: FormData
): Promise<ApiResponse<void>> {
  const orgId = await requireManufacturer();
  if (typeof orgId !== 'string') return orgId;

  const raw = {
    name: (formData.get('name') as string) || undefined,
    modelName: (formData.get('modelName') as string) || undefined,
  };

  const v = productUpdateSchema.safeParse(raw);
  if (!v.success) return createErrorResponse('VALIDATION_ERROR', '입력값을 확인해주세요.', formatZodErrors(v.error));

  const result = await productService.updateProduct(orgId, productId, v.data);
  if (result.success) revalidatePath('/manufacturer/products');
  return { success: result.success, error: result.error };
}

export async function deactivateProductAction(
  productId: string,
  reason: string
): Promise<ApiResponse<void>> {
  const orgId = await requireManufacturer();
  if (typeof orgId !== 'string') return orgId;

  const result = await productService.deactivateProduct(orgId, productId, reason);
  if (result.success) revalidatePath('/manufacturer/products');
  return { success: result.success, error: result.error };
}

export async function activateProductAction(
  productId: string
): Promise<ApiResponse<void>> {
  const orgId = await requireManufacturer();
  if (typeof orgId !== 'string') return orgId;

  const result = await productService.activateProduct(orgId, productId);
  if (result.success) revalidatePath('/manufacturer/products');
  return { success: result.success, error: result.error };
}

export async function getProductsAction(query?: {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}) {
  const orgId = await requireManufacturer();
  if (typeof orgId !== 'string') return orgId;
  return productService.getProducts(orgId, query ?? {});
}

export async function getActiveProductsAction() {
  const orgId = await requireManufacturer();
  if (typeof orgId !== 'string') return orgId;
  return productService.getActiveProducts(orgId);
}
