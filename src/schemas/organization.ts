/**
 * 조직 관련 Zod 스키마
 */
import { z } from 'zod';
import {
  trimmedRequiredStringSchema,
  businessNumberInputSchema,
  phoneNumberInputSchema,
  fileUploadSchema,
  optionalFileUploadSchema,
  emailSchema,
} from './common';

export const orgTypeSchema = z.enum(['MANUFACTURER', 'DISTRIBUTOR', 'HOSPITAL', 'ADMIN']);

export const orgStatusSchema = z.enum(['PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'REJECTED']);

export const organizationInfoSchema = z.object({
  name: trimmedRequiredStringSchema,
  businessNumber: businessNumberInputSchema,
  representativeName: trimmedRequiredStringSchema,
  representativePhone: phoneNumberInputSchema,
  address: trimmedRequiredStringSchema,
});

export const organizationRegisterSchema = z.object({
  type: orgTypeSchema.exclude(['ADMIN']),
  email: emailSchema,
  ...organizationInfoSchema.shape,
});

export const organizationRegisterWithFileSchema = organizationRegisterSchema.extend({
  businessLicenseFile: fileUploadSchema,
});

export const organizationUpdateSchema = z.object({
  representativeName: trimmedRequiredStringSchema.optional(),
  representativePhone: phoneNumberInputSchema.optional(),
  address: trimmedRequiredStringSchema.optional(),
  businessLicenseFile: optionalFileUploadSchema,
});

export const organizationApprovalSchema = z.object({
  organizationId: z.string().uuid(),
  approved: z.boolean(),
  reason: z.string().optional(),
});

export const organizationStatusChangeSchema = z.object({
  organizationId: z.string().uuid(),
  status: orgStatusSchema,
  reason: z.string().optional(),
});

// 제조사 설정
export const manufacturerSettingsSchema = z.object({
  hmacSecret: trimmedRequiredStringSchema,
  codePrefix: z.string().max(10).optional(),
});

export const manufacturerSettingsUpdateSchema = manufacturerSettingsSchema.partial();

// 타입 추론
export type OrganizationRegisterData = z.infer<typeof organizationRegisterSchema>;
export type OrganizationRegisterWithFileData = z.infer<typeof organizationRegisterWithFileSchema>;
export type OrganizationUpdateData = z.infer<typeof organizationUpdateSchema>;
export type OrganizationApprovalData = z.infer<typeof organizationApprovalSchema>;
export type ManufacturerSettingsData = z.infer<typeof manufacturerSettingsSchema>;
