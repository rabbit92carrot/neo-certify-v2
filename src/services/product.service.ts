/**
 * 제품 서비스 — CRUD + 비활성화/활성화
 */

import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, Product, PaginatedResponse } from '@/types/api.types';
import type { ProductCreateData, ProductUpdateData } from '@/schemas/product';
import {
  createErrorResponse,
  createSuccessResponse,
  createNotFoundResponse,
} from './common.service';

// ============================================================================
// 조회
// ============================================================================

export async function getProducts(
  organizationId: string,
  query: { page?: number; pageSize?: number; search?: string; isActive?: boolean }
): Promise<ApiResponse<PaginatedResponse<Product>>> {
  const supabase = await createClient();
  const { page = 1, pageSize = 20, search, isActive } = query;
  const offset = (page - 1) * pageSize;

  let qb = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (isActive !== undefined) qb = qb.eq('is_active', isActive);
  if (search) {
    qb = qb.or(`name.ilike.%${search}%,model_name.ilike.%${search}%,udi_di.ilike.%${search}%`);
  }

  const { data, count, error } = await qb.range(offset, offset + pageSize - 1);
  if (error) return createErrorResponse('QUERY_ERROR', error.message);

  const total = count ?? 0;
  return createSuccessResponse({
    items: data ?? [],
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize), hasMore: offset + pageSize < total },
  });
}

export async function getActiveProducts(
  organizationId: string
): Promise<ApiResponse<Product[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('name');
  if (error) return createErrorResponse('QUERY_ERROR', error.message);
  return createSuccessResponse(data ?? []);
}

export async function getProduct(
  organizationId: string,
  productId: string
): Promise<ApiResponse<Product>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('organization_id', organizationId)
    .single();
  if (error) return createNotFoundResponse('제품을 찾을 수 없습니다.');
  return createSuccessResponse(data);
}

// ============================================================================
// CUD
// ============================================================================

export async function createProduct(
  organizationId: string,
  data: ProductCreateData
): Promise<ApiResponse<Product>> {
  const supabase = await createClient();

  // UDI-DI 중복 확인
  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('udi_di', data.udiDi)
    .single();
  if (existing) return createErrorResponse('DUPLICATE_UDI_DI', '이미 등록된 UDI-DI입니다.');

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      organization_id: organizationId,
      name: data.name,
      udi_di: data.udiDi,
      model_name: data.modelName,
    })
    .select()
    .single();
  if (error) return createErrorResponse('CREATE_FAILED', '제품 등록에 실패했습니다.');
  return createSuccessResponse(product);
}

export async function updateProduct(
  organizationId: string,
  productId: string,
  data: ProductUpdateData
): Promise<ApiResponse<Product>> {
  const supabase = await createClient();
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.modelName !== undefined) updateData.model_name = data.modelName;

  const { data: product, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', productId)
    .eq('organization_id', organizationId)
    .select()
    .single();
  if (error) return createErrorResponse('UPDATE_FAILED', '제품 수정에 실패했습니다.');
  return createSuccessResponse(product);
}

export async function deactivateProduct(
  organizationId: string,
  productId: string,
  reason: string
): Promise<ApiResponse<Product>> {
  const supabase = await createClient();
  const { data: product, error } = await supabase
    .from('products')
    .update({
      is_active: false,
      deactivation_reason: reason as 'DISCONTINUED' | 'SAFETY_ISSUE' | 'OTHER',
    })
    .eq('id', productId)
    .eq('organization_id', organizationId)
    .select()
    .single();
  if (error) return createErrorResponse('DEACTIVATE_FAILED', '제품 비활성화에 실패했습니다.');
  return createSuccessResponse(product);
}

export async function activateProduct(
  organizationId: string,
  productId: string
): Promise<ApiResponse<Product>> {
  const supabase = await createClient();
  const { data: product, error } = await supabase
    .from('products')
    .update({ is_active: true, deactivation_reason: null })
    .eq('id', productId)
    .eq('organization_id', organizationId)
    .select()
    .single();
  if (error) return createErrorResponse('ACTIVATE_FAILED', '제품 활성화에 실패했습니다.');
  return createSuccessResponse(product);
}
