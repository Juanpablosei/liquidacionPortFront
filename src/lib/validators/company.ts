import { z } from 'zod';
import type { Translations } from '@/lib/i18n/es';

const taxIdRegex = /^\d{11}$/;
const phoneRegex = /^[+]?[\d\s()-]{6,20}$/;

type V = Translations['validators'];

export function createCompanySchema(v: V) {
  return z.object({
    name:    z.string().min(2, v.nameMin2).max(255),
    taxId:   z.string().max(50).refine((val) => !val || taxIdRegex.test(val.replace(/-/g, '')), v.cuitFormat).optional().or(z.literal('')),
    address: z.string().max(500).optional().or(z.literal('')),
    phone:    z.string().max(50).refine((val) => !val || phoneRegex.test(val), v.phoneInvalid).optional().or(z.literal('')),
    planCode: z.string().min(1).optional(),
  });
}

export function updateCompanySchema(v: V) {
  return createCompanySchema(v).partial().extend({
    name: z.string().min(2, v.nameMin2).max(255),
  });
}

export function addMemberSchema(v: V) {
  return z.object({
    userId: z.string().uuid(v.userIdInvalid),
    role:   z.enum(['ADMIN', 'MANAGER', 'MEMBER'], { message: v.selectRole }),
  });
}

export type CreateCompanyInput = z.infer<ReturnType<typeof createCompanySchema>>;
export type UpdateCompanyInput = z.infer<ReturnType<typeof updateCompanySchema>>;
export type AddMemberInput     = z.infer<ReturnType<typeof addMemberSchema>>;
