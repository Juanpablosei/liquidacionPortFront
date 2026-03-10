import { z } from 'zod';

// ─── Plan schemas ─────────────────────────────────────────────────────────────

export const createPlanSchema = z.object({
  code:            z.string().min(1, 'Code is required'),
  name:            z.string().min(1, 'Name is required'),
  maxEmployees:    z.number().int().min(1, 'Must be at least 1'),
  monthlyPrice:    z.number().min(0, 'Must be >= 0'),
  annualPrice:     z.number().min(0, 'Must be >= 0'),
  trialDays:       z.number().int().min(0).optional(),
  gracePeriodDays: z.number().int().min(0).optional(),
  isCustom:        z.boolean().optional(),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;

export const updatePlanSchema = createPlanSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;

// ─── Subscription schemas ─────────────────────────────────────────────────────

export const createSubscriptionSchema = z.object({
  companyId:      z.string().uuid('Invalid company ID'),
  planId:         z.string().uuid('Invalid plan ID'),
  billingCycle:   z.enum(['MONTHLY', 'ANNUAL']).optional(),
  effectivePrice: z.number().min(0).optional(),
  notes:          z.string().optional(),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;

export const updateSubscriptionSchema = z.object({
  planId:         z.string().uuid().optional(),
  billingCycle:   z.enum(['MONTHLY', 'ANNUAL']).optional(),
  status:         z.enum(['TRIAL', 'ACTIVE', 'PAST_DUE', 'BLOCKED', 'CANCELLED']).optional(),
  effectivePrice: z.number().min(0).optional(),
  notes:          z.string().optional(),
});

export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;

// ─── Payment schemas ──────────────────────────────────────────────────────────

export const createPaymentSchema = z.object({
  amount:      z.number().min(0.01, 'Amount must be > 0'),
  periodStart: z.string().min(1, 'Period start is required'),
  periodEnd:   z.string().min(1, 'Period end is required'),
  notes:       z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
