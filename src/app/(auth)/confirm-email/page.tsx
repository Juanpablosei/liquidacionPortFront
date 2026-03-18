'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { confirmEmail as confirmEmailApi } from '@/lib/api/auth';
import { ApiRequestError } from '@/lib/api/client';
import { ROUTES } from '@/lib/constants/routes';
import { useTranslation } from '@/lib/i18n';

type State = 'loading' | 'success' | 'error';

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [state, setState] = useState<State>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const t = useTranslation();

  useEffect(() => {
    if (!token) {
      setState('error');
      setErrorMessage(t.auth.confirmEmail.errorInvalid);
      return;
    }

    confirmEmailApi(token)
      .then(() => setState('success'))
      .catch((err) => {
        setState('error');
        if (err instanceof ApiRequestError && err.status === 400) {
          setErrorMessage(t.auth.confirmEmail.errorExpired);
        } else {
          setErrorMessage(t.auth.confirmEmail.errorGeneric);
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center text-center gap-5" style={{ animation: 'fadeUp 0.5s ease both' }}>

      {state === 'loading' && (
        <>
          <div className="w-14 h-14 rounded-2xl bg-overlay border border-border flex items-center justify-center">
            <Loader2 className="w-6 h-6 motion-safe:animate-spin text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-1.5">{t.auth.confirmEmail.loading}</h1>
            <p className="text-sm text-muted-foreground">{t.auth.confirmEmail.loadingSubtitle}</p>
          </div>
        </>
      )}

      {state === 'success' && (
        <>
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-1.5">{t.auth.confirmEmail.successTitle}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.auth.confirmEmail.successSubtitle}
            </p>
          </div>
          <Link
            href={ROUTES.login}
            className="h-11 px-6 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-medium transition-all hover:shadow-[0_0_24px_rgba(37,99,235,0.4)] flex items-center"
          >
            {t.auth.confirmEmail.loginLink}
          </Link>
        </>
      )}

      {state === 'error' && (
        <>
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <XCircle className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-1.5">{t.auth.confirmEmail.errorTitle}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">{errorMessage}</p>
          </div>
          <Link
            href={ROUTES.forgotPassword}
            className="text-sm text-brand hover:text-brand-text transition-colors"
          >
            {t.auth.confirmEmail.requestNewLink}
          </Link>
        </>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-5 w-5 motion-safe:animate-spin text-muted-foreground" />
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  );
}
