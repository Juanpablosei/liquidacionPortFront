'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/utils/toast';
import { CreditCard, Plus } from 'lucide-react';
import { listSubscriptions } from '@/lib/api/admin';
import { ROUTES } from '@/lib/constants/routes';
import { Button } from '@/components/ui/button';
import { PageHeader }     from '@/components/shared/page-header';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState }      from '@/components/shared/empty-state';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { useTranslation }  from '@/lib/i18n';
import { cn }              from '@/lib/utils/cn';
import { getSubscriptionStatusColor } from '@/lib/utils/status-color';
import { SubscriptionFormSheet } from './subscription-form-sheet';
import type { Subscription } from '@/lib/types/admin';
import type { PaginatedResponse } from '@/lib/types/api';

const STATUS_LABELS: Record<string, (t: ReturnType<typeof useTranslation>) => string> = {
  TRIAL:     (t) => t.admin.statusTrial,
  ACTIVE:    (t) => t.admin.statusActive,
  PAST_DUE:  (t) => t.admin.statusPastDue,
  BLOCKED:   (t) => t.admin.statusBlocked,
  CANCELLED: (t) => t.admin.statusCancelled,
};

const CYCLE_LABELS: Record<string, (t: ReturnType<typeof useTranslation>) => string> = {
  MONTHLY: (t) => t.admin.cycleMonthly,
  ANNUAL:  (t) => t.admin.cycleAnnual,
};

export default function SubscriptionsPage() {
  const t = useTranslation();
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Subscription> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listSubscriptions({ page, limit: 20 });
      setData(res);
    } catch {
      toast.error(t.admin.loadError);
    } finally {
      setLoading(false);
    }
  }, [page, t.admin.loadError]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSkeleton variant="table" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.admin.subscriptions}
        description={t.admin.subscriptionsDesc}
        actions={
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t.admin.newSubscription}
          </Button>
        }
      />

      {!data || data.items.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="w-6 h-6" />}
          title={t.admin.noSubscriptions}
        />
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-[#111827] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase border-b border-white/[0.06]">
                <th className="text-left px-4 py-3 font-medium">{t.admin.company}</th>
                <th className="text-left px-4 py-3 font-medium">{t.admin.plan}</th>
                <th className="text-left px-4 py-3 font-medium">{t.admin.cycle}</th>
                <th className="text-left px-4 py-3 font-medium">{t.admin.status}</th>
                <th className="text-right px-4 py-3 font-medium">{t.admin.price}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {data.items.map((sub) => (
                <tr
                  key={sub.id}
                  className="text-slate-300 hover:bg-white/[0.02] cursor-pointer transition-colors"
                  onClick={() => router.push(ROUTES.adminSubscription(sub.id))}
                >
                  <td className="px-4 py-3 font-medium text-white">{sub.company?.name ?? '—'}</td>
                  <td className="px-4 py-3">{sub.plan?.name ?? '—'}</td>
                  <td className="px-4 py-3">{CYCLE_LABELS[sub.billingCycle]?.(t) ?? sub.billingCycle}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
                      getSubscriptionStatusColor(sub.status)
                    )}>
                      {STATUS_LABELS[sub.status]?.(t) ?? sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    <CurrencyDisplay amount={Number(sub.effectivePrice)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06] text-xs text-slate-500">
              <span>{data.total} {data.total === 1 ? t.dataTable.record : t.dataTable.records}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 transition-colors"
                >
                  {t.dataTable.prevPage}
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                  disabled={page === data.pages}
                  className="px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 transition-colors"
                >
                  {t.dataTable.nextPage}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <SubscriptionFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={load}
      />
    </div>
  );
}
