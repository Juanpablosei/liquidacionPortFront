'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FileText, Search, X } from 'lucide-react';
import { toast } from '@/lib/utils/toast';
import { useTranslation, useLocaleId } from '@/lib/i18n';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { listCrossRunPayslips } from '@/lib/api/payroll';
import { listEmployees } from '@/lib/api/employees';
import { ROUTES } from '@/lib/constants/routes';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { RoleGate } from '@/components/shared/role-gate';
import type { ColumnDef } from '@tanstack/react-table';
import type { Payslip } from '@/lib/types/payroll';

const LIMIT = 20;

const INPUT_CLASS =
  'h-9 rounded-md border border-white/[0.1] bg-white/[0.05] px-3 text-sm text-white placeholder:text-slate-600 focus:border-[#2563EB]/50 focus:outline-none';
const SELECT_CLASS =
  'h-9 rounded-md border border-white/[0.1] bg-white/[0.05] px-3 text-sm text-white focus:border-[#2563EB]/50 focus:outline-none';

export default function PayslipsPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const router = useRouter();
  const t = useTranslation();
  const localeId = useLocaleId();
  const { isManager } = usePermissions();

  // Data
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [employeeId, setEmployeeId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Employee list for filter dropdown
  const [employees, setEmployees] = useState<{ id: string; firstName: string; lastName: string }[]>([]);

  // Load employees for filter
  useEffect(() => {
    if (!companyId) return;
    listEmployees(companyId, { limit: 500 })
      .then((res) => setEmployees(res.items.map((e) => ({ id: e.id, firstName: e.firstName, lastName: e.lastName }))))
      .catch(() => {});
  }, [companyId]);

  // Fetch trigger — bump to re-fetch
  const [fetchTrigger, setFetchTrigger] = useState(0);

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    setIsLoading(true);
    listCrossRunPayslips(companyId, {
      page,
      limit: LIMIT,
      employeeId: employeeId || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    })
      .then((res) => {
        if (cancelled) return;
        setPayslips(res.items);
        setTotal(res.total);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        toast.error(err.message ?? t.payslips.loadError);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, page, fetchTrigger]);

  function handleSearch() {
    setPage(1);
    setFetchTrigger((n) => n + 1);
  }

  function handleClear() {
    setEmployeeId('');
    setFromDate('');
    setToDate('');
  }

  const hasFilters = !!(employeeId || fromDate || toDate);

  // Currency formatter
  const fmt = useMemo(() => {
    const nf = new Intl.NumberFormat(localeId, { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
    return (v: string | number) => nf.format(typeof v === 'string' ? parseFloat(v) : v);
  }, [localeId]);

  // Format period range
  const formatPeriod = useCallback((ps: Payslip): string => {
    const period = ps.run?.period;
    if (!period) return '—';
    if (period.name) return period.name;
    const s = new Date(period.startDate).toLocaleDateString(localeId, { day: '2-digit', month: 'short' });
    const e = new Date(period.endDate).toLocaleDateString(localeId, { day: '2-digit', month: 'short', year: 'numeric' });
    return `${s} – ${e}`;
  }, [localeId]);

  const columns = useMemo<ColumnDef<Payslip>[]>(
    () => [
      {
        id: 'employee',
        header: t.payslips.employee,
        cell: ({ row }) => {
          const e = row.original.employee;
          return (
            <span className="text-sm text-white font-medium">
              {e ? `${e.lastName}, ${e.firstName}` : row.original.employeeId.slice(-6)}
            </span>
          );
        },
      },
      {
        id: 'period',
        header: t.payslips.period,
        cell: ({ row }) => (
          <span className="text-sm text-slate-300">{formatPeriod(row.original)}</span>
        ),
      },
      {
        id: 'gross',
        header: t.payslips.gross,
        cell: ({ row }) => (
          <span className="font-mono text-sm text-emerald-400 whitespace-nowrap">
            {fmt(row.original.grossPay)}
          </span>
        ),
      },
      {
        id: 'deductions',
        header: t.payslips.deductions,
        cell: ({ row }) => (
          <span className="font-mono text-sm text-red-400 whitespace-nowrap">
            {fmt(row.original.totalDeductions)}
          </span>
        ),
      },
      {
        id: 'net',
        header: t.payslips.net,
        cell: ({ row }) => (
          <span className="font-mono text-sm font-semibold text-white whitespace-nowrap">
            {fmt(row.original.netPay)}
          </span>
        ),
      },
      {
        id: 'status',
        header: '',
        cell: ({ row }) => {
          const sig = row.original.signature;
          return sig ? (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              {t.payslips.signed}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              {t.payslips.pending}
            </span>
          );
        },
      },
    ],
    [t, fmt, formatPeriod],
  );

  if (!isManager()) {
    return (
      <RoleGate roles={['OWNER', 'ADMIN', 'MANAGER']}>
        <div />
      </RoleGate>
    );
  }

  return (
    <>
      <PageHeader
        title={t.payslips.title}
        description={t.payslips.description}
        backHref={ROUTES.company(companyId)}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t.payslips.employee}</label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className={`${SELECT_CLASS} min-w-[200px]`}
          >
            <option value="">{t.payslips.allEmployees}</option>
            {employees
              .sort((a, b) => a.lastName.localeCompare(b.lastName))
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.lastName}, {e.firstName}
                </option>
              ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t.payslips.fromDate}</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">{t.payslips.toDate}</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <button
          onClick={handleSearch}
          className="h-9 px-4 rounded-md bg-[#2563EB] text-white text-sm font-medium hover:bg-[#2563EB]/90 transition-colors inline-flex items-center gap-2"
        >
          <Search className="w-3.5 h-3.5" />
          {t.payslips.search}
        </button>

        {hasFilters && (
          <button
            onClick={handleClear}
            className="h-9 px-3 rounded-md border border-white/[0.1] text-slate-400 text-sm hover:text-white hover:border-white/[0.2] transition-colors inline-flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            {t.payslips.clear}
          </button>
        )}
      </div>

      {/* Table */}
      {!isLoading && payslips.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-10 h-10" />}
          title={t.payslips.noResults}
        />
      ) : (
        <DataTable
          columns={columns}
          data={payslips}
          total={total}
          page={page}
          limit={LIMIT}
          isLoading={isLoading}
          onPageChange={setPage}
          onRowClick={(ps) => router.push(ROUTES.payrollRun(companyId, ps.runId))}
        />
      )}
    </>
  );
}
