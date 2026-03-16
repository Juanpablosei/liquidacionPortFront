import { z } from 'zod';
import type { Translations } from '@/lib/i18n/es';

type V = Translations['validators'];

export function createUnionSchema(v: V) {
  return z.object({
    name:        z.string().min(2, v.nameRequired).max(100),
    code:        z.string().min(2, v.codeRequired).max(20).regex(/^[A-Z0-9_-]+$/, v.codeFormat),
    duesType:    z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    duesValue:   z.string().min(1, v.numberMin0).refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      v.salaryPositive,
    ),
    description: z.string().max(500).optional().or(z.literal('')),
  });
}

export function updateUnionSchema(v: V) {
  return z.object({
    name:        z.string().min(2, v.nameRequired).max(100).optional(),
    code:        z.string().min(2, v.codeRequired).max(20).regex(/^[A-Z0-9_-]+$/, v.codeFormat).optional(),
    duesType:    z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
    duesValue:   z.string().min(1, v.numberMin0).refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      v.salaryPositive,
    ).optional(),
    description: z.string().max(500).optional().or(z.literal('')),
    isActive:    z.boolean().optional(),
  });
}

export function addMemberSchema(v: V) {
  return z.object({
    employeeId: z.string().uuid(v.selectEmployee),
    startDate:  z.string().min(1, v.startDateRequired),
  });
}

export type CreateUnionInput = z.infer<ReturnType<typeof createUnionSchema>>;
export type UpdateUnionInput = z.infer<ReturnType<typeof updateUnionSchema>>;
export type AddMemberInput   = z.infer<ReturnType<typeof addMemberSchema>>;
