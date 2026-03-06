'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/utils/toast';
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validators/auth';
import { resetPassword as resetPasswordApi } from '@/lib/api/auth';
import { ApiRequestError } from '@/lib/api/client';
import { ROUTES } from '@/lib/constants/routes';
import { useTranslation } from '@/lib/i18n';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [isLoading, setIsLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const t = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema(t.validators)),
  });

  async function onSubmit(data: ResetPasswordFormData) {
    if (!token) {
      toast.error(t.auth.resetPassword.invalidLink);
      return;
    }
    setIsLoading(true);
    try {
      await resetPasswordApi({ token, newPassword: data.newPassword });
      toast.success(t.auth.resetPassword.success);
      router.push(ROUTES.login);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 400) {
        toast.error(t.auth.resetPassword.invalidLink);
      } else {
        toast.error(t.auth.resetPassword.unexpectedError);
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center" style={{ animation: 'fadeUp 0.5s ease both' }}>
        <p className="text-sm text-red-400 mb-4">{t.auth.resetPassword.invalidLink}</p>
        <Link href={ROUTES.forgotPassword}
          className="text-sm text-[#2563EB] hover:text-[#93BBFC] transition-colors">
          {t.auth.resetPassword.requestNewLink}
        </Link>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeUp 0.5s ease both' }}>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white mb-1.5">
          {t.auth.resetPassword.title}
        </h1>
        <p className="text-sm text-slate-400">
          {t.auth.resetPassword.subtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="newPassword" className="text-sm font-medium text-slate-300">
            {t.auth.resetPassword.newPassword}
          </label>
          <div className="relative">
            <input
              id="newPassword"
              type={showNew ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className="h-11 w-full rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-slate-600 px-4 pr-11 text-sm outline-none transition-all focus:border-[#2563EB] focus:bg-white/[0.08] focus:ring-2 focus:ring-[#2563EB]/40"
              {...register('newPassword')}
            />
            <button type="button" onClick={() => setShowNew((v) => !v)}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              aria-label={showNew ? t.auth.resetPassword.hidePassword : t.auth.resetPassword.showPassword} tabIndex={-1}>
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.newPassword ? (
            <p className="text-xs text-red-400">{errors.newPassword.message}</p>
          ) : (
            <p className="text-xs text-slate-400">{t.auth.resetPassword.passwordHint}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-300">
            {t.auth.resetPassword.confirmPassword}
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className="h-11 w-full rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-slate-600 px-4 pr-11 text-sm outline-none transition-all focus:border-[#2563EB] focus:bg-white/[0.08] focus:ring-2 focus:ring-[#2563EB]/40"
              {...register('confirmPassword')}
            />
            <button type="button" onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              aria-label={showConfirm ? t.auth.resetPassword.hidePassword : t.auth.resetPassword.showPassword} tabIndex={-1}>
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-1 h-11 w-full rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium transition-all hover:shadow-[0_0_24px_rgba(37,99,235,0.4)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 motion-safe:animate-spin" />{t.auth.resetPassword.submitting}</>
          ) : (
            t.auth.resetPassword.submit
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link href={ROUTES.login}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {t.auth.resetPassword.backToLogin}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-5 w-5 motion-safe:animate-spin text-slate-500" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
