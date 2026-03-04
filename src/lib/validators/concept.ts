import { z } from 'zod';

export const conceptSchema = z.object({
  code:         z.string().min(1, 'El código es requerido').max(20),
  name:         z.string().min(1, 'El nombre es requerido').max(100),
  category:     z.enum(['EARNING', 'DEDUCTION']),
  calcType:     z.enum(['FIXED', 'PERCENT', 'HOURLY', 'MANUAL']),
  fixedAmount:  z.string().optional(),
  percentValue: z.string().optional(),
  percentBase:  z.enum(['BASIC', 'GROSS']).optional(),
  hourlyRate:   z.string().optional(),
  sortOrder:    z.string().optional(),
});

export type ConceptInput = z.infer<typeof conceptSchema>;
