import { z } from 'zod';

export const createPeriodSchema = z.object({
  periodType: z.enum(['MONTHLY', 'BIWEEKLY', 'WEEKLY', 'CUSTOM']),
  startDate:  z.string().min(1, 'La fecha de inicio es requerida'),
  endDate:    z.string().min(1, 'La fecha de fin es requerida'),
  name:       z.string().max(100).optional(),
});

export type CreatePeriodInput = z.infer<typeof createPeriodSchema>;
