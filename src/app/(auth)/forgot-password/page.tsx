'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validators/auth';
import { forgotPassword as forgotPasswordApi } from '@/lib/api/auth';
import { ROUTES } from '@/lib/constants/routes';
import { useTranslation } from '@/lib/i18n';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const t = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema(t.validators)),
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    setIsLoading(true);
    try {
      await forgotPasswordApi(data.email);
    } catch {
      // Siempre mostrar éxito por seguridad
    } finally {
      setIsLoading(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center text-center gap-5" style={{ animation: 'fadeUp 0.5s ease both' }}>
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">{t.auth.forgotPassword.successTitle}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[300px]">
            {t.auth.forgotPassword.successMessage}
          </p>
        </div>
        <Link
          href={ROUTES.login}
          className="inline-flex items-center gap-2 text-sm text-brand hover:text-brand-text transition-colors mt-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.auth.forgotPassword.backToLogin}
        </Link>
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeUp 0.5s ease both' }}>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-1.5">
          {t.auth.forgotPassword.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t.auth.forgotPassword.subtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
            {t.auth.forgotPassword.email}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            className="h-11 w-full rounded-xl bg-overlay border border-border text-foreground placeholder:text-muted-foreground px-4 text-sm outline-none transition-all focus:border-brand focus:bg-overlay-strong focus:ring-2 focus:ring-brand/20"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-1 h-11 w-full rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-medium transition-all hover:shadow-[0_0_24px_rgba(37,99,235,0.4)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 motion-safe:animate-spin" />
              {t.auth.forgotPassword.submitting}
            </>
          ) : (
            t.auth.forgotPassword.submit
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href={ROUTES.login}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-muted-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.auth.forgotPassword.backToLogin}
        </Link>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
