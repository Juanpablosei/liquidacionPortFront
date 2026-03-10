'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { toast } from '@/lib/utils/toast';
import { getSubscription, listPayments } from '@/lib/api/admin';
import { ROUTES } from '@/lib/constants/routes';
import { PageHeader }     from '@/components/shared/page-header';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { useTranslation }  from '@/lib/i18n';
import type { Subscription, Payment } from '@/lib/types/admin';

export default function SubscriptionDetailPage() {
  const { subscriptionId } = useParams<{ subscriptionId: string }>();
  const t = useTranslation();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [subData, payData] = await Promise.all([
        getSubscription(subscriptionId),
        listPayments(subscriptionId),
      ]);
      setSub(subData);
      setPayments(payData);
    } catch {
      toast.error(t.admin.loadError);
    } finally {
      setLoading(false);
    }
  }, [subscriptionId, t.admin.loadError]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSkeleton variant="detail" />;
  if (!sub) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t.admin.subscription}: ${sub.company?.name ?? sub.id}`}
        backHref={ROUTES.adminSubscriptions}
      />

      {/* Subscription info */}
      <div className="rounded-xl border border-white/[0.06] bg-[#111827] p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-xs text-slate-500">{t.admin.plan}</p>
          <p className="text-white font-medium">{sub.plan?.name ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">{t.admin.status}</p>
          <p className="text-white font-medium">{sub.status}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">{t.admin.cycle}</p>
          <p className="text-white">{sub.billingCycle}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">{t.admin.price}</p>
          <p className="text-white font-mono">
            <CurrencyDisplay amount={Number(sub.effectivePrice)} />
          </p>
        </div>
      </div>

      {/* Payments */}
      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          {t.admin.payments} ({payments.length})
        </h2>

        {payments.length === 0 ? (
          <p className="text-sm text-slate-500">{t.admin.noPayments}</p>
        ) : (
          <div className="rounded-xl border border-white/[0.06] bg-[#111827] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase border-b border-white/[0.06]">
                  <th className="text-right px-4 py-3 font-medium">{t.admin.amount}</th>
                  <th className="text-left px-4 py-3 font-medium">{t.admin.periodStart}</th>
                  <th className="text-left px-4 py-3 font-medium">{t.admin.periodEnd}</th>
                  <th className="text-right px-4 py-3 font-medium">{t.admin.paidAt}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {payments.map((p) => (
                  <tr key={p.id} className="text-slate-300">
                    <td className="px-4 py-3 text-right font-mono">
                      <CurrencyDisplay amount={Number(p.amount)} />
                    </td>
                    <td className="px-4 py-3">{new Date(p.periodStart).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{new Date(p.periodEnd).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{new Date(p.paidAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
