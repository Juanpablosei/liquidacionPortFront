'use client';

import { useEffect, useState } from 'react';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { getCompanySubscription, getCompanyPayments } from '@/lib/api/admin';
import { getSubscriptionStatusColor } from '@/lib/utils/status-color';
import { cn } from '@/lib/utils';
import { useTranslation, useLocaleId } from '@/lib/i18n';
import type { Subscription, Payment } from '@/lib/types/admin';

interface SubscriptionSectionProps {
  companyId: string;
}

export function SubscriptionSection({ companyId }: SubscriptionSectionProps) {
  const t = useTranslation();
  const localeId = useLocaleId();
  const sub = t.companies.settings.subscription;

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [s, p] = await Promise.allSettled([
          getCompanySubscription(companyId),
          getCompanyPayments(companyId),
        ]);

        if (cancelled) return;

        if (s.status === 'fulfilled') {
          setSubscription(s.value);
        }
        // 404 means no subscription — not an error
        if (s.status === 'rejected' && !String(s.reason).includes('404')) {
          setError(true);
        }

        if (p.status === 'fulfilled') {
          setPayments(p.value);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [companyId]);

  if (loading) return null;

  if (error) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-foreground mb-2">{sub.title}</h2>
        <p className="text-sm text-red-400">{sub.loadError}</p>
      </div>
    );
  }

  function statusLabel(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: sub.statusActive,
      TRIAL: sub.statusTrial,
      PAST_DUE: sub.statusPastDue,
      BLOCKED: sub.statusBlocked,
      CANCELLED: sub.statusCancelled,
    };
    return map[status] ?? status;
  }

  function fmtDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(localeId, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-sm font-semibold text-foreground mb-5">{sub.title}</h2>

      {!subscription ? (
        <p className="text-sm text-muted-foreground">{sub.noSubscription}</p>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Subscription info grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <InfoCell label={sub.currentPlan} value={subscription.plan?.name ?? '—'} />
            <InfoCell label={sub.status}>
              <span
                className={cn(
                  'inline-block px-2 py-0.5 text-xs font-medium rounded-md border',
                  getSubscriptionStatusColor(subscription.status),
                )}
              >
                {statusLabel(subscription.status)}
              </span>
            </InfoCell>
            <InfoCell
              label={sub.billingCycle}
              value={subscription.billingCycle === 'MONTHLY' ? sub.monthly : sub.annual}
            />
            <InfoCell label={sub.effectivePrice}>
              <CurrencyDisplay amount={subscription.effectivePrice} className="text-sm" />
            </InfoCell>
            {subscription.currentPeriodStart && (
              <InfoCell
                label={sub.nextRenewal}
                value={`${fmtDate(subscription.currentPeriodStart)} → ${fmtDate(subscription.currentPeriodEnd)}`}
              />
            )}
            {subscription.trialEndsAt && (
              <InfoCell label={sub.trialEndsAt} value={fmtDate(subscription.trialEndsAt)} />
            )}
            {subscription.blockedAt && (
              <InfoCell label={sub.blockedAt} value={fmtDate(subscription.blockedAt)} />
            )}
            {subscription.cancelledAt && (
              <InfoCell label={sub.cancelledAt} value={fmtDate(subscription.cancelledAt)} />
            )}
          </div>

          {/* Payments table */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">{sub.paymentHistory}</h3>

            {payments.length === 0 ? (
              <p className="text-xs text-muted-foreground">{sub.noPayments}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-2 pr-4 text-xs font-medium text-muted-foreground">{sub.amount}</th>
                      <th className="pb-2 pr-4 text-xs font-medium text-muted-foreground">{sub.periodStart}</th>
                      <th className="pb-2 pr-4 text-xs font-medium text-muted-foreground">{sub.periodEnd}</th>
                      <th className="pb-2 text-xs font-medium text-muted-foreground">{sub.paidAt}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-border">
                        <td className="py-2.5 pr-4">
                          <CurrencyDisplay amount={p.amount} className="text-sm" />
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{fmtDate(p.periodStart)}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{fmtDate(p.periodEnd)}</td>
                        <td className="py-2.5 text-muted-foreground">{fmtDate(p.paidAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCell({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <span className="text-xs text-muted-foreground block mb-1">{label}</span>
      {children ?? <span className="text-sm text-foreground">{value}</span>}
    </div>
  );
}
