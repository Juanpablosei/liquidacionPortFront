'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { toast } from '@/lib/utils/toast';
import { changePassword } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth-store';
import { useTranslation } from '@/lib/i18n';

const schema = z.object({
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Las contraseñas no coinciden',
});

type FormData = z.infer<typeof schema>;

export function ForcePasswordModal() {
  const clearMustChangePassword = useAuthStore((s) => s.clearMustChangePassword);
  const t = useTranslation();
  const txt = t.auth.forceChangePassword;

  const [isLoading, setIsLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    try {
      await changePassword({ currentPassword: '', newPassword: data.newPassword });
      clearMustChangePassword();
      toast.success(txt.success);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0F172A] border border-white/[0.08] rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{txt.title}</h2>
            <p className="text-xs text-slate-400">{txt.subtitle}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fp-new" className="text-sm font-medium text-slate-300">
              {txt.newPassword}
            </label>
            <div className="relative">
              <input
                id="fp-new"
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                className="h-11 w-full rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-slate-600 px-4 pr-11 text-sm outline-none transition-all focus:border-[#2563EB] focus:bg-white/[0.08] focus:ring-2 focus:ring-[#2563EB]/40"
                {...register('newPassword')}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500">{txt.passwordHint}</p>
            {errors.newPassword && (
              <p className="text-xs text-red-400">{txt.passwordHint}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="fp-confirm" className="text-sm font-medium text-slate-300">
              {txt.confirmPassword}
            </label>
            <div className="relative">
              <input
                id="fp-confirm"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                className="h-11 w-full rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-slate-600 px-4 pr-11 text-sm outline-none transition-all focus:border-[#2563EB] focus:bg-white/[0.08] focus:ring-2 focus:ring-[#2563EB]/40"
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
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
            className="mt-2 h-11 w-full rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium transition-all hover:shadow-[0_0_24px_rgba(37,99,235,0.4)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 motion-safe:animate-spin" />
                {txt.submitting}
              </>
            ) : (
              txt.submit
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
