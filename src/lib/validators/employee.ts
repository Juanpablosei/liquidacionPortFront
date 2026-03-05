import { z } from 'zod';
import type { Translations } from '@/lib/i18n/es';

const nameRegex = /^[a-záéíóúñüA-ZÁÉÍÓÚÑÜ\s'-]+$/;
const phoneRegex = /^[+]?[\d\s()-]{6,20}$/;

type V = Translations['validators'];

export function createEmployeeSchema(v: V) {
  return z.object({
    documentType:   z.string().min(1, v.docTypeRequired),
    documentNumber: z.string().min(1, v.docNumberRequired).max(20),
    firstName:      z.string().min(1, v.firstNameRequired).max(100).regex(nameRegex, v.nameLettersOnly),
    lastName:       z.string().min(1, v.lastNameRequired).max(100).regex(nameRegex, v.lastNameLetters),
    email:          z.string().email(v.emailInvalid).optional().or(z.literal('')),
    phone:          z.string().max(20).refine((val) => !val || phoneRegex.test(val), v.phoneInvalid).optional().or(z.literal('')),
    birthDate:      z.string().optional().or(z.literal('')),
    hireDate:       z.string().min(1, v.hireDateRequired),
  }).refine((data) => {
    const num = data.documentNumber;
    const type = data.documentType;
    if (!num || !type) return true;
    const digits = num.replace(/[.-]/g, '');
    switch (type) {
      case 'CI':        return /^\d{6,10}$/.test(digits);
      case 'RUC':       return /^\d{10,13}$/.test(digits);
      case 'PASSPORT':  return /^[a-zA-Z0-9]{5,20}$/.test(num);
      case 'OTHER':     return num.length >= 1 && num.length <= 20;
      default:          return true;
    }
  }, {
    message: v.docNumberInvalid,
    path: ['documentNumber'],
  });
}

export function updateEmployeeSchema(v: V) {
  return z.object({
    documentType:   z.string().optional(),
    documentNumber: z.string().max(20).optional(),
    firstName:      z.string().min(1, v.firstNameRequired).max(100).regex(nameRegex, v.nameLettersOnly),
    lastName:       z.string().min(1, v.lastNameRequired).max(100).regex(nameRegex, v.lastNameLetters),
    email:          z.string().email(v.emailInvalid).optional().or(z.literal('')),
    phone:          z.string().max(20).refine((val) => !val || phoneRegex.test(val), v.phoneInvalid).optional().or(z.literal('')),
    birthDate:      z.string().optional().or(z.literal('')),
    hireDate:       z.string().min(1, v.hireDateRequired),
  }).refine((data) => {
    const num = data.documentNumber;
    const type = data.documentType;
    if (!num || !type) return true;
    const digits = num.replace(/[.-]/g, '');
    switch (type) {
      case 'CI':        return /^\d{6,10}$/.test(digits);
      case 'RUC':       return /^\d{10,13}$/.test(digits);
      case 'PASSPORT':  return /^[a-zA-Z0-9]{5,20}$/.test(num);
      case 'OTHER':     return num.length >= 1 && num.length <= 20;
      default:          return true;
    }
  }, {
    message: v.docNumberInvalid,
    path: ['documentNumber'],
  });
}

export function createContractSchema(v: V) {
  return z.object({
    startDate:    z.string().min(1, v.startDateRequired),
    endDate:      z.string().optional().or(z.literal('')),
    salaryType:   z.enum(['MONTHLY', 'HOURLY']),
    salaryAmount: z.string().min(1, v.salaryRequired).refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0 && parseFloat(val) <= 99999999999.99,
      v.salaryPositive,
    ),
  });
}

export function terminateEmployeeSchema(v: V) {
  return z.object({
    terminationDate: z.string().min(1, v.terminationDateRequired),
  });
}

export type CreateEmployeeInput    = z.infer<ReturnType<typeof createEmployeeSchema>>;
export type UpdateEmployeeInput    = z.infer<ReturnType<typeof updateEmployeeSchema>>;
export type CreateContractInput    = z.infer<ReturnType<typeof createContractSchema>>;
export type TerminateEmployeeInput = z.infer<ReturnType<typeof terminateEmployeeSchema>>;
