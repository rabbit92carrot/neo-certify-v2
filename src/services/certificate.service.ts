/**
 * Certificate Service
 * 인증서(가상 코드) CRUD 기본 서비스
 * 
 * "certificate" = virtual_code + lot + product의 복합 엔티티
 */

import { createClient } from '@/lib/supabase/server';
import { AuthService } from './auth.service';
import type {
  ApiResponse,
  VirtualCodeWithDetails,
  Product,
  PaginationMeta,
} from '@/types/api.types';

export class CertificateService {
  /**
   * 내 조직의 가상 코드 목록 조회 (재고)
   */
  static async listMyCodes(params?: {
    status?: 'IN_STOCK' | 'USED' | 'DISPOSED';
    productId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<{ items: VirtualCodeWithDetails[]; meta: PaginationMeta }>> {
    try {
      const orgId = await AuthService.getOrganizationId();
      if (!orgId) {
        return { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } };
      }

      const supabase = await createClient();
      const page = params?.page ?? 1;
      const pageSize = params?.pageSize ?? 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('virtual_codes')
        .select(
          `
          *,
          lot:lots!inner(
            *,
            product:products!inner(*)
          )
        `,
          { count: 'exact' }
        )
        .eq('owner_org_id', orgId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (params?.status) query = query.eq('status', params.status);
      if (params?.productId) query = query.eq('lot.product_id', params.productId);

      const { data, count, error } = await query;

      if (error) {
        return { success: false, error: { code: 'QUERY_FAILED', message: error.message } };
      }

      const total = count ?? 0;
      return {
        success: true,
        data: {
          items: (data ?? []) as unknown as VirtualCodeWithDetails[],
          meta: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
            hasMore: page * pageSize < total,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : '오류 발생' },
      };
    }
  }

  /**
   * 가상 코드 단건 조회 (코드 문자열로)
   */
  static async getByCode(code: string): Promise<ApiResponse<VirtualCodeWithDetails>> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('virtual_codes')
        .select(
          `
          *,
          lot:lots!inner(
            *,
            product:products!inner(*)
          )
        `
        )
        .eq('code', code)
        .single();

      if (error || !data) {
        return { success: false, error: { code: 'NOT_FOUND', message: '코드를 찾을 수 없습니다' } };
      }

      return { success: true, data: data as unknown as VirtualCodeWithDetails };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : '오류 발생' },
      };
    }
  }

  /**
   * 가상 코드 ID로 단건 조회
   */
  static async getById(id: string): Promise<ApiResponse<VirtualCodeWithDetails>> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('virtual_codes')
        .select(
          `
          *,
          lot:lots!inner(
            *,
            product:products!inner(*)
          )
        `
        )
        .eq('id', id)
        .single();

      if (error || !data) {
        return { success: false, error: { code: 'NOT_FOUND', message: '코드를 찾을 수 없습니다' } };
      }

      return { success: true, data: data as unknown as VirtualCodeWithDetails };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : '오류 발생' },
      };
    }
  }

  /**
   * 내 조직의 재고 요약 (제품별)
   */
  static async getInventorySummary(): Promise<
    ApiResponse<
      {
        productId: string;
        productName: string;
        modelName: string;
        udiDi: string;
        totalQuantity: number;
      }[]
    >
  > {
    try {
      const orgId = await AuthService.getOrganizationId();
      if (!orgId) {
        return { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } };
      }

      const supabase = await createClient();

      // 재고 코드를 제품별로 그룹화
      const { data: codes, error } = await supabase
        .from('virtual_codes')
        .select(
          `
          lot:lots!inner(
            product:products!inner(id, name, model_name, udi_di)
          )
        `
        )
        .eq('owner_org_id', orgId)
        .eq('status', 'IN_STOCK');

      if (error) {
        return { success: false, error: { code: 'QUERY_FAILED', message: error.message } };
      }

      // 제품별 집계
      const summaryMap = new Map<
        string,
        { productId: string; productName: string; modelName: string; udiDi: string; totalQuantity: number }
      >();

      for (const code of codes ?? []) {
        const product = (code as any).lot?.product;
        if (!product) continue;

        const existing = summaryMap.get(product.id);
        if (existing) {
          existing.totalQuantity++;
        } else {
          summaryMap.set(product.id, {
            productId: product.id,
            productName: product.name,
            modelName: product.model_name,
            udiDi: product.udi_di,
            totalQuantity: 1,
          });
        }
      }

      return { success: true, data: Array.from(summaryMap.values()) };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : '오류 발생' },
      };
    }
  }

  /**
   * 제품 목록 조회 (내 조직)
   */
  static async listProducts(): Promise<ApiResponse<Product[]>> {
    try {
      const orgId = await AuthService.getOrganizationId();
      if (!orgId) {
        return { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } };
      }

      const supabase = await createClient();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: { code: 'QUERY_FAILED', message: error.message } };
      }

      return { success: true, data: data ?? [] };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : '오류 발생' },
      };
    }
  }

  /**
   * 제품 생성
   */
  static async createProduct(input: {
    name: string;
    udiDi: string;
    modelName: string;
  }): Promise<ApiResponse<Product>> {
    try {
      const orgId = await AuthService.getOrganizationId();
      if (!orgId) {
        return { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } };
      }

      const supabase = await createClient();
      const { data, error } = await supabase
        .from('products')
        .insert({
          organization_id: orgId,
          name: input.name,
          udi_di: input.udiDi,
          model_name: input.modelName,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return {
            success: false,
            error: { code: 'DUPLICATE', message: '동일한 UDI-DI의 제품이 이미 존재합니다' },
          };
        }
        return { success: false, error: { code: 'CREATE_FAILED', message: error.message } };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : '오류 발생' },
      };
    }
  }

  /**
   * Lot별 재고 상세 조회
   */
  static async getInventoryByProduct(productId: string): Promise<
    ApiResponse<
      {
        lotId: string;
        lotNumber: string;
        manufactureDate: string;
        expiryDate: string;
        quantity: number;
      }[]
    >
  > {
    try {
      const orgId = await AuthService.getOrganizationId();
      if (!orgId) {
        return { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } };
      }

      const supabase = await createClient();

      const { data, error } = await supabase
        .from('virtual_codes')
        .select(
          `
          lot:lots!inner(
            id, lot_number, manufacture_date, expiry_date,
            product:products!inner(id)
          )
        `
        )
        .eq('owner_org_id', orgId)
        .eq('status', 'IN_STOCK')
        .eq('lot.product.id', productId);

      if (error) {
        return { success: false, error: { code: 'QUERY_FAILED', message: error.message } };
      }

      // Lot별 집계
      const lotMap = new Map<
        string,
        { lotId: string; lotNumber: string; manufactureDate: string; expiryDate: string; quantity: number }
      >();

      for (const code of data ?? []) {
        const lot = (code as any).lot;
        if (!lot) continue;

        const existing = lotMap.get(lot.id);
        if (existing) {
          existing.quantity++;
        } else {
          lotMap.set(lot.id, {
            lotId: lot.id,
            lotNumber: lot.lot_number,
            manufactureDate: lot.manufacture_date,
            expiryDate: lot.expiry_date,
            quantity: 1,
          });
        }
      }

      return { success: true, data: Array.from(lotMap.values()) };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : '오류 발생' },
      };
    }
  }
}
