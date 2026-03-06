'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/lib/utils/toast';
import { type ColumnDef } from '@tanstack/react-table';
import {
  ShieldCheck,
  ShieldAlert,
  Loader2,
  LogOut,
  Trash2,
  Monitor,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import {
  changePassword,
  getSessions,
  revokeSession,
  logoutAll,
  updateLocale,
} from '@/lib/api/auth';
import { useTranslation }     from '@/lib/i18n';
import { PageHeader }        from '@/components/shared/page-header';
import { DataTable }         from '@/components/shared/data-table';
import { ConfirmDialog }     from '@/components/shared/confirm-dialog';
import { FormField }         from '@/components/shared/form-field';
import { LoadingSkeleton }   from '@/components/shared/loading-skeleton';
import { Input }             from '@/components/ui/input';
import type { UserSession }  from '@/lib/types/auth';

const INPUT_CLASS = 'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 focus:border-[#2563EB]/50 focus:ring-0';

type ChangePasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function ProfilePage() {
  const t = useTranslation();
  const { user } = useAuthStore();

  const changePasswordSchema = useMemo(() => z.object({
    currentPassword: z.string().min(1, t.validators.required),
    newPassword:     z.string().min(8, t.validators.passwordMin8),
    confirmPassword: z.string().min(1, t.validators.required),
  }).refine((d) => d.newPassword === d.confirmPassword, {
    message: t.validators.passwordsMismatch,
    path:    ['confirmPassword'],
  }), [t]);

  const [sessions,       setSessions]      = useState<UserSession[]>([]);
  const [isLoadingSess,  setIsLoadingSess]  = useState(true);
  const [revokeTarget,   setRevokeTarget]   = useState<string | null>(null);
  const [isRevoking,     setIsRevoking]     = useState(false);
  const [logoutAllOpen,  setLogoutAllOpen]  = useState(false);
  const [isLoggingOut,   setIsLoggingOut]   = useState(false);
  const [isSavingPwd,    setIsSavingPwd]    = useState(false);
  const [isSavingLocale, setIsSavingLocale] = useState(false);
  const [showCurrent,    setShowCurrent]    = useState(false);
  const [showNew,        setShowNew]        = useState(false);
  const [showConfirm,    setShowConfirm]    = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });

  const loadSessions = useCallback(() => {
    setIsLoadingSess(true);
    getSessions()
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setIsLoadingSess(false));
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  function formatDate(d: string) {
    const locale = user?.locale === 'en' ? 'en-US' : 'es-AR';
    return new Date(d).toLocaleDateString(locale, {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function parseUserAgent(ua: string | null): string {
    if (!ua) return t.profile.unknownDevice;
    if (/iPhone|iPad/i.test(ua))  return 'iOS';
    if (/Android/i.test(ua))      return 'Android';
    if (/Windows/i.test(ua))      return 'Windows';
    if (/Mac OS X/i.test(ua))     return 'macOS';
    if (/Linux/i.test(ua))        return 'Linux';
    return ua.slice(0, 40);
  }

  async function handleChangePassword(data: ChangePasswordForm) {
    setIsSavingPwd(true);
    try {
      await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success(t.profile.passwordUpdated);
      reset();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.profile.passwordError);
    } finally {
      setIsSavingPwd(false);
    }
  }

  async function handleRevoke() {
    if (!revokeTarget) return;
    setIsRevoking(true);
    try {
      await revokeSession(revokeTarget);
      toast.success(t.profile.sessionRevoked);
      setRevokeTarget(null);
      loadSessions();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.profile.revokeError);
    } finally {
      setIsRevoking(false);
    }
  }

  async function handleLogoutAll() {
    setIsLoggingOut(true);
    try {
      await logoutAll();
      toast.success(t.profile.allSessionsClosed);
      setLogoutAllOpen(false);
      loadSessions();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.profile.closeAllError);
    } finally {
      setIsLoggingOut(false);
    }
  }

  async function handleLocaleChange(locale: string) {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;
    setIsSavingLocale(true);
    const prev = currentUser.locale;
    useAuthStore.getState().setUser({ ...currentUser, locale });
    try {
      await updateLocale(locale);
      toast.success(t.profile.languageUpdated);
    } catch (err: unknown) {
      useAuthStore.getState().setUser({ ...currentUser, locale: prev });
      toast.error((err as Error).message ?? t.profile.languageError);
    } finally {
      setIsSavingLocale(false);
    }
  }

  const initials = ((user?.name ?? user?.email ?? '?')[0] ?? '?').toUpperCase();

  const sessionColumns: ColumnDef<UserSession>[] = [
    {
      header: t.profile.device,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Monitor className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-sm text-slate-300">{parseUserAgent(row.original.userAgent)}</span>
        </div>
      ),
    },
    {
      header: t.profile.ip,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-500">{row.original.ip ?? '—'}</span>
      ),
    },
    {
      header: t.profile.created,
      cell: ({ row }) => (
        <span className="text-xs text-slate-500">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      header: t.profile.expires,
      cell: ({ row }) => (
        <span className="text-xs text-slate-400">{formatDate(row.original.expiresAt)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() => setRevokeTarget(row.original.id)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:outline-none"
          aria-label={t.profile.revokeSession}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t.profile.title}
        description={t.profile.description}
      />

      <div className="max-w-xl flex flex-col gap-5">

        {/* Account info */}
        <section className="bg-[#0B1220] border border-white/[0.07] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">{t.profile.account}</h2>

          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-[#2563EB]/20 border border-[#2563EB]/20 flex items-center justify-center text-lg font-semibold text-[#93BBFC] shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-white truncate">
                {user?.name ?? <span className="text-slate-500 italic text-sm">{t.profile.noName}</span>}
              </p>
              <p className="text-sm text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">{t.profile.emailLabel}</span>
              <span className="text-sm text-white font-mono">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-0.5">
                  {t.profile.verification}
                </span>
                <span className="text-sm text-white">
                  {user?.emailVerifiedAt ? t.profile.verified : t.profile.notVerified}
                </span>
              </div>
              {user?.emailVerifiedAt
                ? <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                : <ShieldAlert className="w-5 h-5 text-yellow-400 shrink-0" />
              }
            </div>
          </div>
        </section>

        {/* Language */}
        <section className="bg-[#0B1220] border border-white/[0.07] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">{t.profile.language}</h2>
          <div className="flex items-center gap-3">
            <select
              value={user?.locale ?? 'es'}
              onChange={(e) => handleLocaleChange(e.target.value)}
              disabled={isSavingLocale}
              className={`${INPUT_CLASS} rounded-xl px-4 py-2.5 text-sm min-w-[180px] appearance-none cursor-pointer disabled:opacity-50`}
            >
              <option value="es">{t.profile.spanish}</option>
              <option value="en">{t.profile.english}</option>
            </select>
            {isSavingLocale && <Loader2 className="w-4 h-4 motion-safe:animate-spin text-slate-400" />}
          </div>
          <p className="text-xs text-slate-500 mt-2">{t.profile.languageDesc}</p>
        </section>

        {/* Change password */}
        <section className="bg-[#0B1220] border border-white/[0.07] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">{t.profile.changePassword}</h2>

          <form onSubmit={handleSubmit(handleChangePassword)} className="flex flex-col gap-4">
            <FormField label={t.profile.currentPassword} name="currentPassword" error={errors.currentPassword?.message} required>
              <div className="relative">
                <Input
                  type={showCurrent ? 'text' : 'password'}
                  {...register('currentPassword')}
                  placeholder="••••••••"
                  className={`${INPUT_CLASS} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>

            <FormField label={t.profile.newPassword} name="newPassword" error={errors.newPassword?.message} required>
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  {...register('newPassword')}
                  placeholder="••••••••"
                  className={`${INPUT_CLASS} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>

            <FormField label={t.profile.confirmPassword} name="confirmPassword" error={errors.confirmPassword?.message} required>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  placeholder="••••••••"
                  className={`${INPUT_CLASS} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSavingPwd}
                className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isSavingPwd && <Loader2 className="w-4 h-4 motion-safe:animate-spin" />}
                {isSavingPwd ? t.common.saving : t.profile.updatePassword}
              </button>
            </div>
          </form>
        </section>

        {/* Sessions */}
        <section className="bg-[#0B1220] border border-white/[0.07] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{t.profile.sessions}</h2>
            {sessions.length > 0 && (
              <button
                onClick={() => setLogoutAllOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                {t.profile.closeAll}
              </button>
            )}
          </div>

          {isLoadingSess ? (
            <LoadingSkeleton variant="table" rows={3} />
          ) : (
            <DataTable
              columns={sessionColumns}
              data={sessions}
              total={sessions.length}
              page={1}
              limit={sessions.length || 1}
              isLoading={false}
              onPageChange={() => {}}
              emptyMessage={t.profile.noSessions}
            />
          )}
        </section>
      </div>

      <ConfirmDialog
        open={!!revokeTarget}
        onOpenChange={(o) => { if (!o) setRevokeTarget(null); }}
        onConfirm={handleRevoke}
        title={t.profile.revokeTitle}
        description={t.profile.revokeDesc}
        confirmLabel={t.profile.revokeLabel}
        variant="danger"
        isLoading={isRevoking}
      />

      <ConfirmDialog
        open={logoutAllOpen}
        onOpenChange={setLogoutAllOpen}
        onConfirm={handleLogoutAll}
        title={t.profile.closeAllTitle}
        description={t.profile.closeAllDesc}
        confirmLabel={t.profile.closeAllLabel}
        variant="danger"
        isLoading={isLoggingOut}
      />
    </>
  );
}
