/**
 * 출고/회수 관련 Zod 스키마
 */
import { z } from 'zod';
import { uuidSchema, trimmedRequiredStringSchema, quantitySchema } from './common';

export const shipmentItemSchema = z.object({
  productId: uuidSchema,
  quantity: quantitySchema,
});

export const shipmentCreateSchema = z.object({
  toOrganizationId: uuidSchema,
  items: z.array(shipmentItemSchema).min(1, '출고 항목을 추가해주세요'),
});

export const shipmentCreateFormSchema = z.object({
  toOrganizationId: uuidSchema,
  items: z
    .array(
      z.object({
        productId: uuidSchema,
        quantity: z.coerce.number().int().min(1, '1개 이상이어야 합니다'),
      })
    )
    .min(1, '출고 항목을 추가해주세요'),
});

export const recallSchema = z.object({
  shipmentBatchId: uuidSchema,
  reason: trimmedRequiredStringSchema,
});

// 장바구니
export const cartItemSchema = z.object({
  productId: uuidSchema,
  productName: z.string(),
  quantity: quantitySchema,
});

export const addToCartSchema = z.object({
  productId: uuidSchema,
  productName: z.string(),
  quantity: quantitySchema,
});

// 타입
export type ShipmentItemData = z.infer<typeof shipmentItemSchema>;
export type ShipmentCreateData = z.infer<typeof shipmentCreateSchema>;
export type RecallData = z.infer<typeof recallSchema>;
export type CartItemData = z.infer<typeof cartItemSchema>;
