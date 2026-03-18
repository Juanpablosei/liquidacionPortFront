'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from '@/lib/utils/toast';
import { Building2, Users, CreditCard, TrendingUp } from 'lucide-react';
import { getDashboardMetrics } from '@/lib/api/admin';
import { PageHeader }     from '@/components/shared/page-header';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { StatCard }        from '@/components/shared/stat-card';
import { useTranslation }  from '@/lib/i18n';
import type { DashboardMetrics } from '@/lib/types/admin';

export default function AdminDashboardPage() {
  const t = useTranslation();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDashboardMetrics();
      setMetrics(data);
    } catch {
      toast.error(t.admin.loadError);
    } finally {
      setLoading(false);
    }
  }, [t.admin.loadError]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSkeleton variant="cards" />;
  if (!metrics) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.admin.dashboard}
        description={t.admin.dashboardDesc}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Building2 className="w-5 h-5" />}
          title={t.admin.totalCompanies}
          value={metrics.companies.total}
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          title={t.admin.totalEmployees}
          value={metrics.employees.active}
        />
        <StatCard
          icon={<CreditCard className="w-5 h-5" />}
          title={t.admin.activeSubscriptions}
          value={metrics.subscriptions.total}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          title={t.admin.revenueThisMonth}
          value={metrics.revenue.currentMonth}
        />
      </div>

      {/* Recent payments */}
      {metrics.recentPayments.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t.admin.recentPayments}
          </h2>
          <div className="rounded-xl border border-border bg-secondary overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase border-b border-border">
                  <th className="text-left px-4 py-3 font-medium">{t.admin.company}</th>
                  <th className="text-right px-4 py-3 font-medium">{t.admin.amount}</th>
                  <th className="text-right px-4 py-3 font-medium">{t.admin.date}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {metrics.recentPayments.map((p) => (
                  <tr key={p.id} className="text-muted-foreground">
                    <td className="px-4 py-3">{p.subscription.company.name}</td>
                    <td className="px-4 py-3 text-right font-mono">${Number(p.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{new Date(p.paidAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Expiring soon */}
      {metrics.expiringSoon.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t.admin.expiringSoon}
          </h2>
          <div className="rounded-xl border border-border bg-secondary overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase border-b border-border">
                  <th className="text-left px-4 py-3 font-medium">{t.admin.company}</th>
                  <th className="text-left px-4 py-3 font-medium">{t.admin.plan}</th>
                  <th className="text-left px-4 py-3 font-medium">{t.admin.status}</th>
                  <th className="text-right px-4 py-3 font-medium">{t.admin.expires}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {metrics.expiringSoon.map((s) => (
                  <tr key={s.id} className="text-muted-foreground">
                    <td className="px-4 py-3">{s.company.name}</td>
                    <td className="px-4 py-3">{s.plan.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium bg-yellow-500/15 text-yellow-400 border-yellow-500/20">
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
