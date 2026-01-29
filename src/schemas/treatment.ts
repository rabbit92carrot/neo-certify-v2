/**
 * 시술 관련 Zod 스키마
 */
import { z } from 'zod';
import { uuidSchema, phoneNumberInputSchema, dateInputSchema, trimmedRequiredStringSchema } from './common';

export const treatmentItemSchema = z.object({
  productId: uuidSchema,
  quantity: z.coerce.number().int().min(1, '1개 이상이어야 합니다'),
});

export const treatmentCreateSchema = z.object({
  patientPhone: phoneNumberInputSchema,
  treatmentDate: dateInputSchema,
  items: z.array(treatmentItemSchema).min(1, '시술 항목을 추가해주세요'),
});

export const treatmentRecallSchema = z.object({
  treatmentId: uuidSchema,
  reason: trimmedRequiredStringSchema,
});

// 폐기
export const disposalCreateSchema = z.object({
  disposalDate: dateInputSchema,
  disposalReasonType: z.enum(['EXPIRED', 'DAMAGED', 'DEFECTIVE', 'OTHER']),
  disposalReasonCustom: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: uuidSchema,
        quantity: z.coerce.number().int().min(1),
      })
    )
    .min(1, '폐기 항목을 추가해주세요'),
});

// 타입
export type TreatmentCreateData = z.infer<typeof treatmentCreateSchema>;
export type TreatmentRecallData = z.infer<typeof treatmentRecallSchema>;
export type DisposalCreateData = z.infer<typeof disposalCreateSchema>;
