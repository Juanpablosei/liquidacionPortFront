'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Play,
  Lock,
  Download,
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronRight,
  Pencil,
  Check,
  X,
  FileText,
  ClipboardCheck,
} from 'lucide-react';
import {
  getRun,
  calculateRun,
  closeRun,
  listPayslips,
  getPayslip,
  patchPayslipLine,
  exportPayslipsCsv,
  exportPayslipsPdf,
  exportPayslipPdf,
  getPayslipSignatures,
} from '@/lib/api/payroll';
import { ROUTES } from '@/lib/constants/routes';
import { useTranslation, useLocaleId } from '@/lib/i18n';
import { PageHeader }    from '@/components/shared/page-header';
import { DataTable }     from '@/components/shared/data-table';
import { StatusBadge }   from '@/components/shared/status-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { RoleGate }      from '@/components/shared/role-gate';
import { usePermissions } from '@/lib/hooks/use-permissions';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { PayrollRun, Payslip, PayslipLine, SignaturesSummary } from '@/lib/types/payroll';

function makeFmt(locale: string) {
  const nf = new Intl.NumberFormat(locale, { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
  return (v: string | number) => nf.format(typeof v === 'string' ? parseFloat(v) : v);
}

function formatDateTime(d: string, locale: string) {
  return new Date(d).toLocaleDateString(locale, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function RunDetailPage() {
  const { companyId, runId } = useParams<{ companyId: string; runId: string }>();
  const { isManager, canEdit } = usePermissions();
  const t = useTranslation();
  const localeId = useLocaleId();
  const fmt = makeFmt(localeId);

  const [run,           setRun]           = useState<PayrollRun | null>(null);
  const [payslips,      setPayslips]       = useState<Payslip[]>([]);
  const [isLoading,     setIsLoading]      = useState(true);
  const [isCalculating, setIsCalculating]  = useState(false);
  const [isClosing,     setIsClosing]      = useState(false);
  const [isExporting,   setIsExporting]    = useState(false);
  const [closeConfirm,  setCloseConfirm]   = useState(false);
  const [selectedSlip,  setSelectedSlip]   = useState<Payslip | null>(null);
  const [slipLoading,   setSlipLoading]    = useState(false);
  const [editingLine,   setEditingLine]    = useState<string | null>(null);
  const [editValue,     setEditValue]      = useState('');
  const [isSavingLine,  setIsSavingLine]   = useState(false);
  const [signatures,    setSignatures]     = useState<SignaturesSummary | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isDownloadingSlipPdf, setIsDownloadingSlipPdf] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadRun = useCallback(async () => {
    if (!companyId || !runId) return;
    try {
      const r = await getRun(companyId, runId);
      setRun(r);
      return r;
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.payroll.runDetail.loadError);
    }
  }, [companyId, runId]);

  const loadPayslips = useCallback(async () => {
    if (!companyId || !runId) return;
    try {
      const ps = await listPayslips(companyId, runId, { limit: 100 });
      setPayslips(ps);
    } catch {
      // silently ignore if no payslips yet
    }
  }, [companyId, runId]);

  const loadSignatures = useCallback(async () => {
    if (!companyId || !runId) return;
    try {
      const sigs = await getPayslipSignatures(companyId, runId);
      setSignatures(sigs);
    } catch {
      // silently ignore — signatures might not be available
    }
  }, [companyId, runId]);

  useEffect(() => {
    if (!companyId || !runId) return;
    setIsLoading(true);
    Promise.all([loadRun(), loadPayslips(), loadSignatures()])
      .finally(() => setIsLoading(false));
  }, [companyId, runId, loadRun, loadPayslips, loadSignatures]);

  // Polling when RUNNING
  useEffect(() => {
    if (run?.status === 'RUNNING') {
      pollRef.current = setInterval(async () => {
        const updated = await loadRun();
        if (updated && updated.status !== 'RUNNING') {
          if (pollRef.current) clearInterval(pollRef.current);
          loadPayslips();
          loadSignatures();
          toast.success(t.payroll.runDetail.calcCompleted);
        }
      }, 3000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [run?.status, loadRun, loadPayslips]);

  async function handleCalculate() {
    setIsCalculating(true);
    try {
      const updated = await calculateRun(companyId, runId);
      setRun(updated);
      // If the backend completed synchronously, load payslips immediately
      if (updated.status === 'COMPLETED' || updated.status === 'CLOSED') {
        await loadPayslips();
        toast.success('Cálculo completado');
      } else {
        toast.success(t.payroll.runDetail.calculating);
      }
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.payroll.runDetail.calcError);
    } finally {
      setIsCalculating(false);
    }
  }

  async function handleClose() {
    setIsClosing(true);
    try {
      const updated = await closeRun(companyId, runId);
      setRun(updated);
      toast.success(t.payroll.runDetail.runClosed);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.payroll.runDetail.closeError);
    } finally {
      setIsClosing(false);
      setCloseConfirm(false);
    }
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const blob = await exportPayslipsCsv(companyId, runId);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `nomina-run-${runId.slice(-8)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.payroll.runDetail.exportError);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleExportPdf() {
    setIsExportingPdf(true);
    try {
      const blob = await exportPayslipsPdf(companyId, runId);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `nomina-run-${runId.slice(-8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.payroll.runDetail.pdfError);
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleDownloadSlipPdf(payslipId: string) {
    setIsDownloadingSlipPdf(true);
    try {
      const blob = await exportPayslipPdf(companyId, runId, payslipId);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `recibo-${payslipId.slice(-8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.payroll.runDetail.pdfError);
    } finally {
      setIsDownloadingSlipPdf(false);
    }
  }

  async function handleOpenPayslip(payslip: Payslip) {
    setSelectedSlip(payslip);
    if (!payslip.lines) {
      setSlipLoading(true);
      try {
        const full = await getPayslip(companyId, runId, payslip.id);
        setSelectedSlip(full);
      } catch {
        toast.error(t.payroll.runDetail.loadError);
      } finally {
        setSlipLoading(false);
      }
    }
  }

  async function handleSaveLine(payslipId: string, lineId: string) {
    setIsSavingLine(true);
    try {
      await patchPayslipLine(companyId, runId, payslipId, lineId, { amount: editValue });
      toast.success(t.payroll.runDetail.lineUpdated);
      setEditingLine(null);
      // Refresh the payslip detail
      const full = await getPayslip(companyId, runId, payslipId);
      setSelectedSlip(full);
      // Refresh payslips list
      loadPayslips();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.payroll.runDetail.lineSaveError);
    } finally {
      setIsSavingLine(false);
    }
  }

  const isClosed    = run?.status === 'CLOSED';
  const isRunning   = run?.status === 'RUNNING';
  const isCompleted = run?.status === 'COMPLETED';
  const isDraft     = run?.status === 'DRAFT';

  const columns: ColumnDef<Payslip>[] = [
    {
      header: t.payroll.runDetail.employee,
      cell: ({ row }) => {
        const e = row.original.employee;
        return (
          <span className="text-sm text-white font-medium">
            {e ? `${e.lastName}, ${e.firstName}` : `${t.payroll.runDetail.employee} ${row.original.employeeId.slice(-6)}`}
          </span>
        );
      },
    },
    {
      header: t.payroll.runDetail.earnings,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-emerald-400">{fmt(row.original.grossPay)}</span>
      ),
    },
    {
      header: t.payroll.runDetail.deductions,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-red-400">{fmt(row.original.totalDeductions)}</span>
      ),
    },
    {
      header: t.payroll.runDetail.net,
      cell: ({ row }) => (
        <span className="font-mono text-sm font-semibold text-white">{fmt(row.original.netPay)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() => handleOpenPayslip(row.original)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#93BBFC] transition-colors cursor-pointer"
        >
          {t.payroll.runDetail.viewDetail}
          <ChevronRight className="w-3 h-3" />
        </button>
      ),
    },
  ];

  if (!isManager()) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400 text-sm">{t.common.noPermission}</p>
      </div>
    );
  }

  // Totals from payslips
  const totals = payslips.reduce(
    (acc, p) => ({
      gross:      acc.gross      + parseFloat(p.grossPay),
      deductions: acc.deductions + parseFloat(p.totalDeductions),
      net:        acc.net        + parseFloat(p.netPay),
    }),
    { gross: 0, deductions: 0, net: 0 },
  );

  return (
    <>
      <PageHeader
        title={`Run #${runId.slice(-8).toUpperCase()}`}
        description={run?.runAt ? t.payroll.runDetail.processed.replace('{date}', formatDateTime(run.runAt, localeId)) : t.payroll.runDetail.notProcessed}
        backHref={ROUTES.payroll(companyId)}
        actions={
          run && (
            <div className="flex items-center gap-2">
              <StatusBadge status={run.status} />

              {/* Calculate button — only for DRAFT or COMPLETED */}
              {(isDraft || isCompleted) && canEdit() && (
                <button
                  onClick={handleCalculate}
                  disabled={isCalculating}
                  className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isCalculating ? <Loader2 className="w-4 h-4 motion-safe:animate-spin" /> : <Play className="w-4 h-4" />}
                  {isCalculating ? t.payroll.runDetail.calculating : t.payroll.runDetail.calculate}
                </button>
              )}

              {/* Close button — only COMPLETED */}
              {isCompleted && canEdit() && (
                <RoleGate roles={['OWNER', 'ADMIN']}>
                  <button
                    onClick={() => setCloseConfirm(true)}
                    disabled={isClosing}
                    className="inline-flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Lock className="w-4 h-4" />
                    {t.payroll.runDetail.closeRun}
                  </button>
                </RoleGate>
              )}

              {/* Export CSV */}
              {(isCompleted || isClosed) && (
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="inline-flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-slate-300 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isExporting ? <Loader2 className="w-4 h-4 motion-safe:animate-spin" /> : <Download className="w-4 h-4" />}
                  {isExporting ? t.payroll.runDetail.exporting : t.payroll.runDetail.export}
                </button>
              )}

              {/* Export PDF (all payslips) */}
              {(isCompleted || isClosed) && (
                <button
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="inline-flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-slate-300 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isExportingPdf ? <Loader2 className="w-4 h-4 motion-safe:animate-spin" /> : <FileText className="w-4 h-4" />}
                  {isExportingPdf ? t.payroll.runDetail.exportingPdf : t.payroll.runDetail.exportPdf}
                </button>
              )}
            </div>
          )
        }
      />

      {/* RUNNING banner */}
      {isRunning && (
        <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <Loader2 className="w-4 h-4 text-yellow-400 motion-safe:animate-spin shrink-0" />
          <p className="text-sm text-yellow-300">
            {t.payroll.runDetail.pollingMsg}
          </p>
        </div>
      )}

      {/* Summary cards */}
      {payslips.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: t.payroll.runDetail.totalEarnings,   value: totals.gross,      icon: <TrendingUp className="w-4 h-4" />,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: t.payroll.runDetail.totalDeductions, value: totals.deductions,  icon: <TrendingDown className="w-4 h-4" />, color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
            { label: t.payroll.runDetail.totalNet,        value: totals.net,         icon: <DollarSign className="w-4 h-4" />,  color: 'text-white',       bg: 'bg-[#2563EB]/10 border-[#2563EB]/20' },
          ].map((card) => (
            <div key={card.label} className={`rounded-xl border px-4 py-3 ${card.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={card.color}>{card.icon}</span>
                <span className="text-xs text-slate-500">{card.label}</span>
              </div>
              <p className={`font-mono text-lg font-semibold ${card.color}`}>{fmt(card.value)}</p>
            </div>
          ))}
        </div>
      )}

      <DataTable
        columns={columns}
        data={payslips}
        total={payslips.length}
        page={1}
        limit={payslips.length || 1}
        isLoading={isLoading}
        onPageChange={() => {}}
        emptyMessage={isRunning ? t.payroll.runDetail.calculatingSlips : t.payroll.runDetail.noSlips}
        emptyIcon={<FileText className="w-6 h-6" />}
        emptyDescription={
          isRunning
            ? t.payroll.runDetail.generatingMsg
            : isDraft
            ? t.payroll.runDetail.notCalculatedMsg
            : t.payroll.runDetail.noSlipsGenerated
        }
        emptyAction={
          isDraft && canEdit() ? (
            <button
              onClick={handleCalculate}
              disabled={isCalculating}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isCalculating ? <Loader2 className="w-4 h-4 motion-safe:animate-spin" /> : <Play className="w-4 h-4" />}
              {isCalculating ? t.payroll.runDetail.calculating : t.payroll.runDetail.calculateAction}
            </button>
          ) : undefined
        }
      />

      {/* Signatures dashboard — OWNER/ADMIN only */}
      {signatures && signatures.total > 0 && (isCompleted || isClosed) && (
        <RoleGate roles={['OWNER', 'ADMIN']}>
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardCheck className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-white">{t.payroll.runDetail.signatures}</h3>
              <span className="text-xs text-slate-500 ml-auto">
                {t.payroll.runDetail.signaturesProg
                  .replace('{signed}', String(signatures.signed))
                  .replace('{total}', String(signatures.total))}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 rounded-full bg-white/[0.06] mb-4 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${(signatures.signed / signatures.total) * 100}%` }}
              />
            </div>

            {/* Employee signatures table */}
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">{t.payroll.runDetail.employee}</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">{t.common.status}</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">{t.common.notes}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {signatures.details.map((d) => (
                    <tr key={d.employeeId} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-white">
                        {d.lastName}, {d.firstName}
                      </td>
                      <td className="px-4 py-2.5">
                        {d.signed ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                            <Check className="w-3 h-3" />
                            {t.payroll.runDetail.signedLabel}
                            {d.signedAt && (
                              <span className="text-slate-500 ml-1">
                                — {formatDateTime(d.signedAt, localeId)}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-xs text-amber-400">{t.payroll.runDetail.pendingLabel}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">
                        {d.comment || t.payroll.runDetail.noComment}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </RoleGate>
      )}

      {/* Close run confirm */}
      <ConfirmDialog
        open={closeConfirm}
        onOpenChange={setCloseConfirm}
        onConfirm={handleClose}
        title={t.payroll.runDetail.closeTitle}
        description={t.payroll.runDetail.closeDesc}
        confirmLabel={t.payroll.runDetail.closeLabel}
        variant="danger"
        isLoading={isClosing}
      />

      {/* Payslip detail drawer */}
      <Sheet open={!!selectedSlip} onOpenChange={(o) => { if (!o) { setSelectedSlip(null); setEditingLine(null); } }}>
        <SheetContent
          className="bg-[#060B16] border-l border-white/[0.08] text-white overflow-y-auto"
          style={{ width: 480, maxWidth: '100vw' }}
        >
          {selectedSlip && (
            <>
              <SheetHeader className="pb-4 border-b border-white/[0.06]">
                <SheetTitle className="text-white">
                  {selectedSlip.employee
                    ? `${selectedSlip.employee.lastName}, ${selectedSlip.employee.firstName}`
                    : t.payroll.runDetail.earnings}
                </SheetTitle>
              </SheetHeader>

              {slipLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 text-slate-500 motion-safe:animate-spin" />
                </div>
              ) : (
                <div className="p-4 flex flex-col gap-4">
                  {/* Lines */}
                  <div>
                    {/* Earnings */}
                    <PayslipSection
                      title={t.payroll.runDetail.earnings}
                      lines={(selectedSlip.lines ?? []).filter((l) => l.category === 'EARNING')}
                      color="emerald"
                      canEdit={isCompleted && canEdit() && !isClosed}
                      editingLine={editingLine}
                      editValue={editValue}
                      isSavingLine={isSavingLine}
                      onStartEdit={(line) => { setEditingLine(line.id); setEditValue(line.amount); }}
                      onCancelEdit={() => setEditingLine(null)}
                      onSaveEdit={(lineId) => handleSaveLine(selectedSlip.id, lineId)}
                      onEditValueChange={setEditValue}
                      fmt={fmt}
                      labels={{ save: t.common.save, cancel: t.common.cancel, edit: t.common.edit }}
                    />

                    {/* Deductions */}
                    <PayslipSection
                      title={t.payroll.runDetail.deductions}
                      lines={(selectedSlip.lines ?? []).filter((l) => l.category === 'DEDUCTION')}
                      color="red"
                      canEdit={isCompleted && canEdit() && !isClosed}
                      editingLine={editingLine}
                      editValue={editValue}
                      isSavingLine={isSavingLine}
                      onStartEdit={(line) => { setEditingLine(line.id); setEditValue(line.amount); }}
                      onCancelEdit={() => setEditingLine(null)}
                      onSaveEdit={(lineId) => handleSaveLine(selectedSlip.id, lineId)}
                      onEditValueChange={setEditValue}
                      fmt={fmt}
                      labels={{ save: t.common.save, cancel: t.common.cancel, edit: t.common.edit }}
                    />
                  </div>

                  {/* Totals */}
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] divide-y divide-white/[0.05]">
                    <TotalRow label={t.payroll.runDetail.gross}        value={selectedSlip.grossPay}        color="text-emerald-400" fmt={fmt} />
                    <TotalRow label={t.payroll.runDetail.deductions}  value={selectedSlip.totalDeductions}  color="text-red-400" fmt={fmt} />
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm font-semibold text-white">{t.payroll.runDetail.netPayable}</span>
                      <span className="font-mono text-lg font-bold text-white">{fmt(selectedSlip.netPay)}</span>
                    </div>
                  </div>

                  {/* Signature status */}
                  {selectedSlip.signature !== undefined && (
                    <div className="rounded-xl border px-4 py-3 flex items-center gap-3"
                      style={{
                        borderColor: selectedSlip.signature ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                        background:  selectedSlip.signature ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)',
                      }}
                    >
                      <ClipboardCheck className={`w-4 h-4 shrink-0 ${selectedSlip.signature ? 'text-emerald-400' : 'text-amber-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${selectedSlip.signature ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {selectedSlip.signature ? t.payroll.runDetail.signedLabel : t.payroll.runDetail.pendingLabel}
                        </p>
                        {selectedSlip.signature?.signedAt && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {t.payroll.runDetail.signedAt.replace('{date}', formatDateTime(selectedSlip.signature.signedAt, localeId))}
                          </p>
                        )}
                        {selectedSlip.signature?.comment && (
                          <p className="text-xs text-slate-400 mt-0.5">{selectedSlip.signature.comment}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Download individual PDF */}
                  <button
                    onClick={() => handleDownloadSlipPdf(selectedSlip.id)}
                    disabled={isDownloadingSlipPdf}
                    className="w-full inline-flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isDownloadingSlipPdf ? <Loader2 className="w-4 h-4 motion-safe:animate-spin" /> : <Download className="w-4 h-4" />}
                    {isDownloadingSlipPdf ? t.payroll.runDetail.downloadingPdf : t.payroll.runDetail.downloadPdf}
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

// ─── Sub-components ──────────────────────────────────────────────────────────

function PayslipSection({
  title,
  lines,
  color,
  canEdit,
  editingLine,
  editValue,
  isSavingLine,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditValueChange,
  fmt: fmtFn,
  labels,
}: {
  title:              string;
  lines:              PayslipLine[];
  color:              'emerald' | 'red';
  canEdit:            boolean;
  editingLine:        string | null;
  editValue:          string;
  isSavingLine:       boolean;
  onStartEdit:        (line: PayslipLine) => void;
  onCancelEdit:       () => void;
  onSaveEdit:         (lineId: string) => void;
  onEditValueChange:  (v: string) => void;
  fmt:                (v: string | number) => string;
  labels:             { save: string; cancel: string; edit: string };
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
          <div key={line.id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/[0.03] focus-within:bg-white/[0.03] group">
            <div className="flex-1 min-w-0">
              <span className="text-xs font-mono text-slate-400 mr-1.5">{line.conceptCode}</span>
              <span className="text-sm text-slate-300 truncate">{line.conceptName}</span>
            </div>

            {editingLine === line.id ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.01"
                  value={editValue}
                  onChange={(e) => onEditValueChange(e.target.value)}
                  className="w-28 px-2 py-1 rounded bg-white/[0.08] border border-white/[0.15] text-white text-xs font-mono focus:outline-none focus:border-[#2563EB]/50"
                  autoFocus
                />
                <button
                  onClick={() => onSaveEdit(line.id)}
                  disabled={isSavingLine}
                  aria-label={labels.save}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-emerald-400 hover:bg-emerald-500/10 transition-colors duration-150 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingLine ? <Loader2 className="w-3.5 h-3.5 motion-safe:animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={onCancelEdit}
                  aria-label={labels.cancel}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className={`font-mono text-sm ${colorClass}`}>{fmtFn(line.amount)}</span>
                {canEdit && (
                  <button
                    onClick={() => onStartEdit(line)}
                    aria-label={labels.edit}
                    className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:outline-none"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TotalRow({ label, value, color, fmt: fmtFn }: { label: string; value: string; color: string; fmt: (v: string | number) => string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`font-mono text-sm ${color}`}>{fmtFn(value)}</span>
    </div>
  );
}
