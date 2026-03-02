import { z } from 'zod';

export const createCompanySchema = z.object({
  name:    z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  taxId:   z.string().max(20).optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  phone:   z.string().max(20).optional().or(z.literal('')),
});

export const updateCompanySchema = createCompanySchema.partial().extend({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
});

export const addMemberSchema = z.object({
  email: z.string().email('Email inválido'),
  role:  z.enum(['ADMIN', 'MANAGER', 'MEMBER'], 'Seleccioná un rol'),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type AddMemberInput     = z.infer<typeof addMemberSchema>;
