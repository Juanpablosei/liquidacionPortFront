'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/lib/utils/toast';
import { getSubscription, listPayments, deletePayment } from '@/lib/api/admin';
import { ROUTES } from '@/lib/constants/routes';
import { Button } from '@/components/ui/button';
import { PageHeader }      from '@/components/shared/page-header';
import { LoadingSkeleton }  from '@/components/shared/loading-skeleton';
import { CurrencyDisplay }  from '@/components/shared/currency-display';
import { ConfirmDialog }    from '@/components/shared/confirm-dialog';
import { useTranslation }   from '@/lib/i18n';
import { cn }               from '@/lib/utils/cn';
import { getSubscriptionStatusColor } from '@/lib/utils/status-color';
import { SubscriptionFormSheet } from '../subscription-form-sheet';
import { PaymentFormSheet } from '../payment-form-sheet';
import type { Subscription, Payment } from '@/lib/types/admin';

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

export default function SubscriptionDetailPage() {
  const { subscriptionId } = useParams<{ subscriptionId: string }>();
  const t = useTranslation();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  async function handleDeletePayment() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePayment(subscriptionId, deleteTarget.id);
      toast.success(t.admin.paymentDeleted);
      setDeleteTarget(null);
      load();
    } catch {
      toast.error(t.admin.deleteError);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <LoadingSkeleton variant="detail" />;
  if (!sub) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t.admin.subscription}: ${sub.company?.name ?? sub.id}`}
        backHref={ROUTES.adminSubscriptions}
        actions={
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            {t.admin.editSubscription}
          </Button>
        }
      />

      {/* Subscription info */}
      <div className="rounded-xl border border-white/[0.06] bg-[#111827] p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-xs text-slate-500">{t.admin.plan}</p>
          <p className="text-white font-medium">{sub.plan?.name ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">{t.admin.status}</p>
          <span className={cn(
            'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium mt-1',
            getSubscriptionStatusColor(sub.status)
          )}>
            {STATUS_LABELS[sub.status]?.(t) ?? sub.status}
          </span>
        </div>
        <div>
          <p className="text-xs text-slate-500">{t.admin.cycle}</p>
          <p className="text-white">{CYCLE_LABELS[sub.billingCycle]?.(t) ?? sub.billingCycle}</p>
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            {t.admin.payments} ({payments.length})
          </h2>
          <Button size="sm" onClick={() => setPaymentOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            {t.admin.newPayment}
          </Button>
        </div>

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
                  <th className="px-4 py-3 w-10" />
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
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                        aria-label={t.admin.deletePayment}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <SubscriptionFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        subscription={sub}
        onSuccess={load}
      />

      <PaymentFormSheet
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        subscriptionId={subscriptionId}
        onSuccess={load}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={t.admin.deletePayment}
        description={t.admin.deletePaymentConfirm}
        onConfirm={handleDeletePayment}
        isLoading={deleting}
      />
    </div>
  );
}
