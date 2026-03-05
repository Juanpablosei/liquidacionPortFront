import { z } from 'zod';
import type { Translations } from '@/lib/i18n/es';

const codeRegex = /^[A-Za-z0-9_-]+$/;

type V = Translations['validators'];

export function conceptSchema(v: V) {
  return z.object({
    code:         z.string().min(1, v.codeRequired).max(20).regex(codeRegex, v.codeFormat).transform((val) => val.toUpperCase()),
    name:         z.string().min(1, v.nameRequired).max(100),
    category:     z.enum(['EARNING', 'DEDUCTION']),
    calcType:     z.enum(['FIXED', 'PERCENT', 'HOURLY', 'MANUAL']),
    fixedAmount:  z.string().optional().refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), v.numberMin0),
    percentValue: z.string().optional().refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100), v.percentRange),
    percentBase:  z.enum(['BASIC', 'GROSS']).optional(),
    hourlyRate:   z.string().optional().refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), v.numberMin0),
    sortOrder:    z.string().optional().refine((val) => !val || (!isNaN(parseInt(val)) && parseInt(val) >= 0), v.integerMin0),
  });
}

export type ConceptInput = z.infer<ReturnType<typeof conceptSchema>>;
