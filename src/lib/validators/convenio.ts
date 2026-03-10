import { z } from 'zod';

// ─── Bracket rule schemas ─────────────────────────────────────────────────────

export const seniorityBonusRuleSchema = z.object({
  minYears:       z.number().min(0),
  maxYears:       z.number().min(1),
  percentPerYear: z.number().min(0).max(100),
}).refine((d) => d.maxYears > d.minYears, {
  message: 'maxYears must be greater than minYears',
  path: ['maxYears'],
});

export const vacationRuleSchema = z.object({
  minYears: z.number().min(0),
  maxYears: z.number().min(1),
  days:     z.number().int().min(0),
}).refine((d) => d.maxYears > d.minYears, {
  message: 'maxYears must be greater than minYears',
  path: ['maxYears'],
});

export const sickLeaveRuleSchema = vacationRuleSchema;

// ─── Convenio schemas ─────────────────────────────────────────────────────────

export const createConvenioSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  seniorityBonusRules: z.array(seniorityBonusRuleSchema).optional(),
  vacationRules:       z.array(vacationRuleSchema).optional(),
  sickLeaveRules:      z.array(sickLeaveRuleSchema).optional(),
});

export type CreateConvenioInput = z.infer<typeof createConvenioSchema>;

export const updateConvenioSchema = createConvenioSchema.partial();
export type UpdateConvenioInput = z.infer<typeof updateConvenioSchema>;

// ─── Category schemas ─────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  code:       z.string().min(1, 'Code is required'),
  name:       z.string().min(1, 'Name is required'),
  baseSalary: z.number().min(0.01, 'Base salary must be > 0'),
  hourlyRate: z.number().min(0.01, 'Hourly rate must be > 0'),
  sortOrder:  z.number().int().min(0).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial();
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// ─── Assign convenio to employee ──────────────────────────────────────────────

export const assignConvenioSchema = z.object({
  convenioId:         z.string().uuid().nullable().optional(),
  convenioCategoryId: z.string().uuid().nullable().optional(),
});

export type AssignConvenioInput = z.infer<typeof assignConvenioSchema>;
