'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useTranslation } from '@/lib/i18n';
import { usePermissions } from '@/lib/hooks/use-permissions';

interface SubscriptionWarningBannerProps {
  status: 'PAST_DUE' | 'BLOCKED';
  companyId: string;
}

function getStorageKey(companyId: string): string {
  return `subscription-banner-dismissed-${companyId}`;
}

export function SubscriptionWarningBanner({ status, companyId }: SubscriptionWarningBannerProps) {
  const t = useTranslation();
  const { isAdmin } = usePermissions();
  const isDismissed = useCallback((): boolean => {
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem(getStorageKey(companyId)) === '1';
  }, [companyId]);

  const [dismissed, setDismissed] = useState(isDismissed);

  if (dismissed) return null;

  const isBlocked = status === 'BLOCKED';
  const message = isBlocked
    ? t.subscriptionBanner.blockedWarning
    : t.subscriptionBanner.pastDueWarning;

  function handleDismiss(): void {
    sessionStorage.setItem(getStorageKey(companyId), '1');
    setDismissed(true);
  }

  return (
    <div
      role="alert"
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border p-3',
        isBlocked
          ? 'bg-red-500/10 border-red-500/20 text-red-400'
          : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="text-sm">{message}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isAdmin() && (
          <Link
            href={`/companies/${companyId}/settings`}
            className={cn(
              'text-xs font-medium underline underline-offset-2 hover:opacity-80 transition-opacity duration-150',
              isBlocked ? 'text-red-400' : 'text-yellow-400',
            )}
          >
            {t.subscriptionBanner.goToSettings}
          </Link>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          className="p-0.5 rounded hover:bg-overlay-strong transition-colors duration-150"
          aria-label={t.common.close}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
