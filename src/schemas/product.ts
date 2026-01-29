/**
 * 제품/Lot 관련 Zod 스키마
 */
import { z } from 'zod';
import {
  uuidSchema,
  trimmedRequiredStringSchema,
  quantitySchema,
  quantityInputSchema,
  dateStringSchema,
  dateInputSchema,
} from './common';

// ============================================================================
// 제품 스키마
// ============================================================================

export const productCreateSchema = z.object({
  name: trimmedRequiredStringSchema,
  udiDi: trimmedRequiredStringSchema,
  modelName: trimmedRequiredStringSchema,
});

export const productUpdateSchema = z.object({
  name: trimmedRequiredStringSchema.optional(),
  modelName: trimmedRequiredStringSchema.optional(),
});

export const productDeactivateSchema = z.object({
  productId: uuidSchema,
  reason: z.enum(['DISCONTINUED', 'SAFETY_ISSUE', 'OTHER']),
});

// ============================================================================
// Lot 스키마
// ============================================================================

export const lotCreateSchema = z.object({
  productId: uuidSchema,
  lotNumber: trimmedRequiredStringSchema,
  quantity: quantitySchema,
  manufactureDate: dateStringSchema,
  expiryDate: dateStringSchema,
});

export const lotCreateFormSchema = z
  .object({
    productId: uuidSchema,
    lotNumber: trimmedRequiredStringSchema,
    quantity: quantityInputSchema,
    manufactureDate: dateInputSchema,
    expiryDate: dateInputSchema,
  })
  .refine(
    (data) => new Date(data.expiryDate) > new Date(data.manufactureDate),
    {
      message: '유효기한은 제조일 이후여야 합니다',
      path: ['expiryDate'],
    }
  );

// 타입 추론
export type ProductCreateData = z.infer<typeof productCreateSchema>;
export type ProductUpdateData = z.infer<typeof productUpdateSchema>;
export type ProductDeactivateData = z.infer<typeof productDeactivateSchema>;
export type LotCreateData = z.infer<typeof lotCreateSchema>;
export type LotCreateFormData = z.infer<typeof lotCreateFormSchema>;
