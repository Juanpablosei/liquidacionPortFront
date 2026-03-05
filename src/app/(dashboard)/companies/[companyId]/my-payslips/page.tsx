'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { type ColumnDef } from '@tanstack/react-table';
import { FileText, CheckCircle2, Clock } from 'lucide-react';
import { listMyPayslips } from '@/lib/api/payroll';
import { ROUTES } from '@/lib/constants/routes';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { useTranslation, useLocaleId } from '@/lib/i18n';
import type { Payslip } from '@/lib/types/payroll';

const LIMIT = 15;

export default function MyPayslipsPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const router = useRouter();
  const t = useTranslation();
  const localeId = useLocaleId();

  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(() => {
    if (!companyId) return;
    setIsLoading(true);
    listMyPayslips(companyId, { page, limit: LIMIT })
      .then((res) => {
        setPayslips(res.items);
        setTotal(res.total);
      })
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setIsLoading(false));
  }, [companyId, page]);

  useEffect(() => { load(); }, [load]);

  const columns: ColumnDef<Payslip>[] = [
    {
      header: t.myPayslips.period,
      cell: ({ row }) => {
        const period = row.original.run?.period;
        return (
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-sm text-white font-medium">
              {period?.name ?? formatPeriod(period?.startDate, period?.endDate, localeId)}
            </span>
          </div>
        );
      },
    },
    {
      header: t.myPayslips.net,
      cell: ({ row }) => (
        <CurrencyDisplay amount={row.original.netPay} className="text-sm font-medium text-white" />
      ),
    },
    {
      header: t.myPayslips.status,
      cell: ({ row }) => (
        row.original.signature ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t.myPayslips.signed}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400">
            <Clock className="w-3.5 h-3.5" />
            {t.myPayslips.pending}
          </span>
        )
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t.myPayslips.title}
        description={t.myPayslips.description}
        backHref={ROUTES.company(companyId)}
      />

      <DataTable
        columns={columns}
        data={payslips}
        total={total}
        page={page}
        limit={LIMIT}
        isLoading={isLoading}
        onPageChange={setPage}
        onRowClick={(ps) => router.push(ROUTES.myPayslip(companyId, ps.id))}
        emptyMessage={t.myPayslips.noPayslips}
      />
    </>
  );
}

function formatPeriod(start?: string, end?: string, locale?: string): string {
  if (!start) return '—';
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const opts: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
  const startStr = s.toLocaleDateString(locale ?? 'es', opts);
  if (!e) return startStr;
  return `${s.toLocaleDateString(locale ?? 'es', { day: '2-digit', month: '2-digit' })} – ${e.toLocaleDateString(locale ?? 'es', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
}
