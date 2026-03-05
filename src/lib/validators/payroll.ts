import { z } from 'zod';
import type { Translations } from '@/lib/i18n/es';

type V = Translations['validators'];

export function createPeriodSchema(v: V) {
  return z.object({
    periodType: z.enum(['MONTHLY', 'BIWEEKLY', 'WEEKLY', 'CUSTOM']),
    startDate:  z.string().min(1, v.startDateRequired),
    endDate:    z.string().min(1, v.dateRequired),
    name:       z.string().max(100).optional(),
  });
}

export type CreatePeriodInput = z.infer<ReturnType<typeof createPeriodSchema>>;
