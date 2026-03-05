import { z } from 'zod';
import type { Translations } from '@/lib/i18n/es';

const nameRegex = /^[a-záéíóúñüA-ZÁÉÍÓÚÑÜ\s'-]+$/;

type V = Translations['validators'];

function passwordSchema(v: V) {
  return z
    .string()
    .min(8, v.passwordMin8)
    .regex(/[A-Z]/, v.passwordUppercase)
    .regex(/[a-z]/, v.passwordLowercase)
    .regex(/[0-9]/, v.passwordNumber);
}

export function loginSchema(v: V) {
  return z.object({
    email:    z.string().email(v.emailInvalid),
    password: z.string().min(1, v.passwordRequired),
  });
}

export function registerSchema(v: V) {
  return z.object({
    name:     z.string().min(2, v.nameMin2).max(100).regex(nameRegex, v.nameLettersOnly).optional().or(z.literal('')),
    email:    z.string().email(v.emailInvalid),
    password: passwordSchema(v),
  });
}

export function forgotPasswordSchema(v: V) {
  return z.object({
    email: z.string().email(v.emailInvalid),
  });
}

export function resetPasswordSchema(v: V) {
  return z
    .object({
      newPassword:     passwordSchema(v),
      confirmPassword: z.string().min(1, v.confirmPassword),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: v.passwordsMismatch,
      path:    ['confirmPassword'],
    });
}

export function changePasswordSchema(v: V) {
  return z
    .object({
      currentPassword: z.string().min(1, v.currentPasswordRequired),
      newPassword:     passwordSchema(v),
      confirmPassword: z.string().min(1, v.confirmPassword),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: v.passwordsMismatch,
      path:    ['confirmPassword'],
    });
}

export type LoginFormData         = z.infer<ReturnType<typeof loginSchema>>;
export type RegisterFormData      = z.infer<ReturnType<typeof registerSchema>>;
export type ForgotPasswordFormData = z.infer<ReturnType<typeof forgotPasswordSchema>>;
export type ResetPasswordFormData  = z.infer<ReturnType<typeof resetPasswordSchema>>;
export type ChangePasswordFormData = z.infer<ReturnType<typeof changePasswordSchema>>;
