'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/utils/toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { loginSchema, type LoginFormData } from '@/lib/validators/auth';
import { login as loginApi, sendConfirmationEmail } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth-store';
import { ApiRequestError } from '@/lib/api/client';
import { ROUTES } from '@/lib/constants/routes';
import { useTranslation } from '@/lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const loginStore = useAuthStore((s) => s.login);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const t = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema(t.validators)),
  });

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true);
    try {
      const res = await loginApi(data);
      if (res.mustChangePassword) {
        sessionStorage.setItem('_tmp_pwd', data.password);
      }
      loginStore(res.user, res.accessToken, res.refreshToken, res.mustChangePassword);

      const isSuperAdmin =
        res.user.systemRole === 'SUPER_ADMIN' || res.user.systemRole === 'SUPER_VIEWER';
      router.push(isSuperAdmin ? ROUTES.admin : ROUTES.companies);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 401) {
          toast.error(t.auth.login.invalidCreds);
        } else if (err.status === 403) {
          toast.error(t.auth.login.mustConfirm);
          sendConfirmationEmail(data.email)
            .then(() => toast.success(t.auth.login.resendSuccess))
            .catch(() => {});
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error(t.auth.login.unexpectedError);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ animation: 'fadeUp 0.5s ease both' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-1.5">
          {t.auth.login.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t.auth.login.subtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
            {t.auth.login.email}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            className="h-11 w-full rounded-xl bg-overlay border border-border text-foreground placeholder:text-muted-foreground px-4 text-sm outline-none transition-all focus:border-brand focus:bg-overlay-strong focus:ring-2 focus:ring-brand/40"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
              {t.auth.login.password}
            </label>
            <Link
              href={ROUTES.forgotPassword}
              className="text-xs text-brand hover:text-brand-text transition-colors"
            >
              {t.auth.login.forgotPassword}
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-11 w-full rounded-xl bg-overlay border border-border text-foreground placeholder:text-muted-foreground px-4 pr-11 text-sm outline-none transition-all focus:border-brand focus:bg-overlay-strong focus:ring-2 focus:ring-brand/40"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-muted-foreground transition-colors cursor-pointer"
              aria-label={showPassword ? t.auth.login.hidePassword : t.auth.login.showPassword}
              tabIndex={-1}
            >
              {showPassword
                ? <EyeOff className="w-4 h-4" />
                : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-400">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="mt-1 h-11 w-full rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-medium transition-all hover:shadow-[0_0_24px_rgba(37,99,235,0.4)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 motion-safe:animate-spin" />
              {t.auth.login.submitting}
            </>
          ) : (
            t.auth.login.submit
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-overlay-strong" />
        <span className="text-xs text-muted-foreground">{t.common.or}</span>
        <div className="flex-1 h-px bg-overlay-strong" />
      </div>

      {/* Register link */}
      <p className="text-center text-sm text-muted-foreground">
        {t.auth.login.noAccount}{' '}
        <Link
          href={ROUTES.register}
          className="text-brand hover:text-brand-text font-medium transition-colors"
        >
          {t.auth.login.registerLink}
        </Link>
      </p>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
