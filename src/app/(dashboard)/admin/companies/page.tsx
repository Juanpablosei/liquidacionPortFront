'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from '@/lib/utils/toast';
import { Building2 } from 'lucide-react';
import { listAdminCompanies } from '@/lib/api/admin';
import { PageHeader }     from '@/components/shared/page-header';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState }      from '@/components/shared/empty-state';
import { useTranslation }  from '@/lib/i18n';
import { cn }              from '@/lib/utils/cn';
import { getSubscriptionStatusColor } from '@/lib/utils/status-color';
import type { AdminCompany } from '@/lib/types/admin';
import type { PaginatedResponse } from '@/lib/types/api';

const STATUS_LABELS: Record<string, (t: ReturnType<typeof useTranslation>) => string> = {
  TRIAL:     (t) => t.admin.statusTrial,
  ACTIVE:    (t) => t.admin.statusActive,
  PAST_DUE:  (t) => t.admin.statusPastDue,
  BLOCKED:   (t) => t.admin.statusBlocked,
  CANCELLED: (t) => t.admin.statusCancelled,
};

export default function AdminCompaniesPage() {
  const t = useTranslation();
  const [data, setData] = useState<PaginatedResponse<AdminCompany> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listAdminCompanies({ page, limit: 20 });
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
        title={t.admin.companies}
        description={t.admin.companiesDesc}
      />

      {!data || data.items.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-6 h-6" />}
          title={t.admin.noCompanies}
        />
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-[#111827] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase border-b border-white/[0.06]">
                <th className="text-left px-4 py-3 font-medium">{t.common.name}</th>
                <th className="text-left px-4 py-3 font-medium">{t.admin.plan}</th>
                <th className="text-left px-4 py-3 font-medium">{t.admin.status}</th>
                <th className="text-right px-4 py-3 font-medium">{t.admin.employees}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {data.items.map((company) => (
                <tr key={company.id} className="text-slate-300">
                  <td className="px-4 py-3 font-medium text-white">{company.name}</td>
                  <td className="px-4 py-3">{company.subscription?.plan.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
                      getSubscriptionStatusColor(company.subscription?.status)
                    )}>
                      {company.subscription?.status ? (STATUS_LABELS[company.subscription.status]?.(t) ?? company.subscription.status) : 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{company._count.employees}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
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
    </div>
  );
}
