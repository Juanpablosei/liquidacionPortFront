import { z } from 'zod';
import type { Translations } from '@/lib/i18n/es';

type V = Translations['validators'];

const ruleBracketSchema = z.object({
  minYears: z.number().int().min(0),
  maxYears: z.number().int().min(0),
  days:     z.number().int().min(0),
});

export function createSettlementSchema(v: V) {
  return z.object({
    reason:          z.enum(['DISMISSAL', 'RESIGNATION'], { message: v.required }),
    terminationDate: z.string().min(1, v.required),
  });
}

export function updateSettlementConfigSchema(v: V) {
  return z.object({
    noticePeriodRules:    z.array(ruleBracketSchema).min(1, v.required).optional(),
    severanceDaysPerYear: z.number().int().min(1, v.required).optional(),
    vacationRules:        z.array(ruleBracketSchema).min(1, v.required).optional(),
  });
}

export type CreateSettlementInput       = z.infer<ReturnType<typeof createSettlementSchema>>;
export type UpdateSettlementConfigInput = z.infer<ReturnType<typeof updateSettlementConfigSchema>>;
