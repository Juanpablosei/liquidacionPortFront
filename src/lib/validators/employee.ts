import { z } from 'zod';

export const createEmployeeSchema = z.object({
  documentType:   z.string().min(1, 'Seleccioná un tipo de documento'),
  documentNumber: z.string().min(1, 'El número de documento es requerido').max(20),
  firstName:      z.string().min(1, 'El nombre es requerido').max(100),
  lastName:       z.string().min(1, 'El apellido es requerido').max(100),
  email:          z.string().email('Email inválido').optional().or(z.literal('')),
  phone:          z.string().max(20).optional().or(z.literal('')),
  birthDate:      z.string().optional().or(z.literal('')),
  hireDate:       z.string().min(1, 'La fecha de ingreso es requerida'),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  firstName: z.string().min(1, 'El nombre es requerido').max(100),
  lastName:  z.string().min(1, 'El apellido es requerido').max(100),
  hireDate:  z.string().min(1, 'La fecha de ingreso es requerida'),
});

export const createContractSchema = z.object({
  startDate:    z.string().min(1, 'La fecha de inicio es requerida'),
  endDate:      z.string().optional().or(z.literal('')),
  salaryType:   z.enum(['MONTHLY', 'HOURLY']),
  salaryAmount: z.string().min(1, 'El monto es requerido').refine(
    (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
    'El monto debe ser un número positivo',
  ),
});

export const terminateEmployeeSchema = z.object({
  terminationDate: z.string().min(1, 'La fecha de baja es requerida'),
});

export type CreateEmployeeInput   = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput   = z.infer<typeof updateEmployeeSchema>;
export type CreateContractInput   = z.infer<typeof createContractSchema>;
export type TerminateEmployeeInput = z.infer<typeof terminateEmployeeSchema>;
