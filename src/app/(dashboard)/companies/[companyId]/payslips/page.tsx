'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FileText, Search, X, Loader2, ClipboardCheck, Download } from 'lucide-react';
import { toast } from '@/lib/utils/toast';
import { useTranslation, useLocaleId } from '@/lib/i18n';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { listCrossRunPayslips, getPayslip, exportPayslipPdf } from '@/lib/api/payroll';
import { listEmployees } from '@/lib/api/employees';
import { ROUTES } from '@/lib/constants/routes';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { ColumnDef } from '@tanstack/react-table';
import type { Payslip, PayslipLine } from '@/lib/types/payroll';

const LIMIT = 20;

const INPUT_CLASS =
  'h-9 rounded-md border border-border bg-overlay px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand/50 focus:outline-none';
const SELECT_CLASS =
  'h-9 rounded-md border border-border bg-overlay px-3 text-sm text-foreground focus:border-brand/50 focus:outline-none';

function formatDateTime(d: string, locale: string) {
  return new Date(d).toLocaleDateString(locale, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function LinesSection({ title, lines, color, fmt: fmtFn }: {
  title: string;
  lines: PayslipLine[];
  color: 'emerald' | 'red';
  fmt: (v: string | number) => string;
}) {
  if (lines.length === 0) return null;
  const colorClass = color === 'emerald' ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="mb-3">
      <p className={`text-[11px] font-semibold uppercase tracking-wider ${colorClass} mb-2`}>
        {title}
      </p>
      <div className="flex flex-col gap-1">
        {lines.map((line) => (
          <div key={line.id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-overlay-subtle">
            <div className="flex-1 min-w-0">
              <span className="text-xs font-mono text-muted-foreground mr-1.5">{line.conceptCode}</span>
              <span className="text-sm text-muted-foreground truncate">{line.conceptName}</span>
            </div>
            <span className={`font-mono text-sm ${colorClass}`}>{fmtFn(line.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

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

  // Detail sheet state
  const [selectedSlip, setSelectedSlip] = useState<Payslip | null>(null);
  const [slipLoading, setSlipLoading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Load employees for filter
  useEffect(() => {
    if (!companyId) return;
    listEmployees(companyId, { limit: 100 })
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

  // Open detail sheet
  function handleRowClick(ps: Payslip) {
    setSelectedSlip(ps); // show immediately with summary data
    setSlipLoading(true);
    getPayslip(companyId, ps.runId, ps.id)
      .then((full) => setSelectedSlip(full))
      .catch((err: Error) => toast.error(err.message ?? t.payslips.loadError))
      .finally(() => setSlipLoading(false));
  }

  // Download PDF
  function handleDownloadPdf() {
    if (!selectedSlip) return;
    setIsDownloadingPdf(true);
    exportPayslipPdf(companyId, selectedSlip.runId, selectedSlip.id)
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const empName = selectedSlip.employee
          ? `${selectedSlip.employee.lastName}_${selectedSlip.employee.firstName}`
          : selectedSlip.id.slice(-6);
        a.download = `recibo_${empName}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setIsDownloadingPdf(false));
  }

  const columns = useMemo<ColumnDef<Payslip>[]>(
    () => [
      {
        id: 'employee',
        header: t.payslips.employee,
        cell: ({ row }) => {
          const e = row.original.employee;
          return (
            <span className="text-sm text-foreground font-medium">
              {e ? `${e.lastName}, ${e.firstName}` : row.original.employeeId.slice(-6)}
            </span>
          );
        },
      },
      {
        id: 'period',
        header: t.payslips.period,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatPeriod(row.original)}</span>
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
          <span className="font-mono text-sm font-semibold text-foreground whitespace-nowrap">
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
    router.push(ROUTES.company(companyId));
    return null;
  }

  const earnings = (selectedSlip?.lines ?? []).filter((l) => l.category === 'EARNING');
  const deductions = (selectedSlip?.lines ?? []).filter((l) => l.category === 'DEDUCTION');

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
          <label className="text-xs text-muted-foreground">{t.payslips.employee}</label>
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
          <label className="text-xs text-muted-foreground">{t.payslips.fromDate}</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">{t.payslips.toDate}</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <button
          onClick={handleSearch}
          className="h-9 px-4 rounded-md bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors inline-flex items-center gap-2"
        >
          <Search className="w-3.5 h-3.5" />
          {t.payslips.search}
        </button>

        {hasFilters && (
          <button
            onClick={handleClear}
            className="h-9 px-3 rounded-md border border-border text-muted-foreground text-sm hover:text-foreground hover:border-border transition-colors inline-flex items-center gap-1.5"
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
          onRowClick={handleRowClick}
        />
      )}

      {/* Payslip detail sheet */}
      <Sheet open={!!selectedSlip} onOpenChange={(o) => { if (!o) setSelectedSlip(null); }}>
        <SheetContent
          className="bg-sidebar border-l border-border text-foreground overflow-y-auto"
          style={{ width: 480, maxWidth: '100vw' }}
        >
          {selectedSlip && (
            <>
              <SheetHeader className="pb-4 border-b border-border">
                <SheetTitle className="text-foreground">
                  {selectedSlip.employee
                    ? `${selectedSlip.employee.lastName}, ${selectedSlip.employee.firstName}`
                    : selectedSlip.employeeId.slice(-6)}
                </SheetTitle>
                <p className="text-sm text-muted-foreground">{formatPeriod(selectedSlip)}</p>
              </SheetHeader>

              {slipLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 text-muted-foreground motion-safe:animate-spin" />
                </div>
              ) : (
                <div className="p-4 flex flex-col gap-4">
                  {/* Lines */}
                  <div>
                    <LinesSection
                      title={t.payslips.gross}
                      lines={earnings}
                      color="emerald"
                      fmt={fmt}
                    />
                    <LinesSection
                      title={t.payslips.deductions}
                      lines={deductions}
                      color="red"
                      fmt={fmt}
                    />
                  </div>

                  {/* Totals */}
                  <div className="rounded-xl bg-overlay-subtle border border-border divide-y divide-border">
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-xs text-muted-foreground">{t.payslips.gross}</span>
                      <span className="font-mono text-sm text-emerald-400">{fmt(selectedSlip.grossPay)}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-xs text-muted-foreground">{t.payslips.deductions}</span>
                      <span className="font-mono text-sm text-red-400">{fmt(selectedSlip.totalDeductions)}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm font-semibold text-foreground">{t.payslips.net}</span>
                      <span className="font-mono text-lg font-bold text-foreground">{fmt(selectedSlip.netPay)}</span>
                    </div>
                  </div>

                  {/* Signature status */}
                  {selectedSlip.signature !== undefined && (
                    <div
                      className="rounded-xl border px-4 py-3 flex items-center gap-3"
                      style={{
                        borderColor: selectedSlip.signature ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                        background:  selectedSlip.signature ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)',
                      }}
                    >
                      <ClipboardCheck className={`w-4 h-4 shrink-0 ${selectedSlip.signature ? 'text-emerald-400' : 'text-amber-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${selectedSlip.signature ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {selectedSlip.signature ? t.payslips.signed : t.payslips.pending}
                        </p>
                        {selectedSlip.signature?.signedAt && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t.payslips.signedAt.replace('{date}', formatDateTime(selectedSlip.signature.signedAt, localeId))}
                          </p>
                        )}
                        {selectedSlip.signature?.comment && (
                          <p className="text-xs text-muted-foreground mt-0.5">{selectedSlip.signature.comment}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Download PDF */}
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf}
                    className="w-full inline-flex items-center justify-center gap-2 bg-overlay-subtle hover:bg-overlay-strong border border-border text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isDownloadingPdf ? <Loader2 className="w-4 h-4 motion-safe:animate-spin" /> : <Download className="w-4 h-4" />}
                    {isDownloadingPdf ? t.payslips.pending : 'PDF'}
                  </button>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
