'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { toast } from '@/lib/utils/toast';
import {
  Play,
  Loader2,
  FileText,
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
  getJobStatus,
} from '@/lib/api/payroll';
import { ApiRequestError } from '@/lib/api/client';
import { ROUTES } from '@/lib/constants/routes';
import { useTranslation, useLocaleId } from '@/lib/i18n';
import { PageHeader }    from '@/components/shared/page-header';
import { DataTable }     from '@/components/shared/data-table';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { usePermissions } from '@/lib/hooks/use-permissions';
import type { PayrollRun, Payslip, PayslipLine, SignaturesSummary } from '@/lib/types/payroll';

import { RunSummaryCards }     from './_components/run-summary-cards';
import { SignaturesDashboard } from './_components/signatures-dashboard';
import { PayslipDetailSheet }  from './_components/payslip-detail-sheet';
import { HeaderActions }       from './_components/header-actions';
import { buildPayslipColumns, downloadBlob } from './_components/payslip-columns';

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
  const [jobId, setJobId] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Data loading ─────────────────────────────────────────────────────── */

  const loadRun = useCallback(async () => {
    if (!companyId || !runId) return;
    try {
      const r = await getRun(companyId, runId);
      setRun(r);
      return r;
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.payroll.runDetail.loadError);
    }
  }, [companyId, runId, t.payroll.runDetail.loadError]);

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

  // Polling job status when calculating
  useEffect(() => {
    if (!companyId || !runId) return;
    const shouldPoll = jobId || run?.status === 'RUNNING';
    if (!shouldPoll) return;

    pollRef.current = setInterval(async () => {
      try {
        const job = await getJobStatus(companyId, runId);
        if (job.status === 'completed') {
          if (pollRef.current) clearInterval(pollRef.current);
          setJobId(null);
          await loadRun();
          await loadPayslips();
          await loadSignatures();
          toast.success(t.payroll.runDetail.calcCompleted);
        } else if (job.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current);
          setJobId(null);
          await loadRun();
          toast.error(`${t.payroll.runDetail.calcFailed}: ${job.failedReason ?? ''}`);
        }
      } catch {
        // If job-status endpoint fails, fall back to checking run status
        const updated = await loadRun();
        if (updated && updated.status !== 'RUNNING') {
          if (pollRef.current) clearInterval(pollRef.current);
          setJobId(null);
          loadPayslips();
          loadSignatures();
          toast.success(t.payroll.runDetail.calcCompleted);
        }
      }
    }, 3000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [jobId, run?.status, companyId, runId, loadRun, loadPayslips, loadSignatures, t.payroll.runDetail.calcCompleted, t.payroll.runDetail.calcFailed]);

  /* ── Action handlers ──────────────────────────────────────────────────── */

  async function handleCalculate() {
    setIsCalculating(true);
    try {
      const result = await calculateRun(companyId, runId);
      // Async response: save jobId to trigger polling
      if (result.jobId) {
        setJobId(result.jobId);
        setRun((prev) => prev ? { ...prev, status: 'RUNNING' } : prev);
        toast.success(t.payroll.runDetail.calcQueued);
      } else {
        // Fallback: sync response (shouldn't happen with new backend)
        await loadRun();
        await loadPayslips();
        toast.success(t.payroll.runDetail.calcCompleted);
      }
    } catch (err: unknown) {
      if (err instanceof ApiRequestError && err.status === 503) {
        toast.error(t.payroll.runDetail.serviceUnavailable);
      } else {
        toast.error((err as Error).message ?? t.payroll.runDetail.calcError);
      }
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
      downloadBlob(blob, `nomina-run-${runId.slice(-8)}.csv`);
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
      downloadBlob(blob, `nomina-run-${runId.slice(-8)}.pdf`);
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
      downloadBlob(blob, `recibo-${payslipId.slice(-8)}.pdf`);
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
      const full = await getPayslip(companyId, runId, payslipId);
      setSelectedSlip(full);
      loadPayslips();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.payroll.runDetail.lineSaveError);
    } finally {
      setIsSavingLine(false);
    }
  }

  /* ── Derived state ────────────────────────────────────────────────────── */

  const isClosed    = run?.status === 'CLOSED';
  const isRunning   = run?.status === 'RUNNING';
  const isCompleted = run?.status === 'COMPLETED';
  const isDraft     = run?.status === 'DRAFT';

  const totals = payslips.reduce(
    (acc, p) => ({
      gross:      acc.gross      + parseFloat(p.grossPay),
      deductions: acc.deductions + parseFloat(p.totalDeductions),
      net:        acc.net        + parseFloat(p.netPay),
    }),
    { gross: 0, deductions: 0, net: 0 },
  );

  /* ── Table columns ────────────────────────────────────────────────────── */

  const columns = buildPayslipColumns(fmt, {
    employee: t.payroll.runDetail.employee,
    earnings: t.payroll.runDetail.earnings,
    deductions: t.payroll.runDetail.deductions,
    net: t.payroll.runDetail.net,
    viewDetail: t.payroll.runDetail.viewDetail,
  }, handleOpenPayslip);

  /* ── Permission guard ─────────────────────────────────────────────────── */

  if (!isManager()) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground text-sm">{t.common.noPermission}</p>
      </div>
    );
  }

  /* ── Render ───────────────────────────────────────────────────────────── */

  return (
    <>
      <PageHeader
        title={`Run #${runId.slice(-8).toUpperCase()}`}
        description={run?.runAt ? t.payroll.runDetail.processed.replace('{date}', formatDateTime(run.runAt, localeId)) : t.payroll.runDetail.notProcessed}
        backHref={ROUTES.payroll(companyId)}
        actions={run && (
          <HeaderActions
            run={run} isDraft={isDraft} isCompleted={isCompleted} isClosed={isClosed}
            isCalculating={isCalculating || isRunning || !!jobId} isClosing={isClosing} isExporting={isExporting} isExportingPdf={isExportingPdf}
            canEdit={canEdit()} onCalculate={handleCalculate} onClose={() => setCloseConfirm(true)} onExport={handleExport} onExportPdf={handleExportPdf}
            labels={{
              calculating: t.payroll.runDetail.calculating,
              calculate: t.payroll.runDetail.calculate,
              closeRun: t.payroll.runDetail.closeRun,
              exporting: t.payroll.runDetail.exporting,
              export: t.payroll.runDetail.export,
              exportingPdf: t.payroll.runDetail.exportingPdf,
              exportPdf: t.payroll.runDetail.exportPdf,
            }}
          />
        )}
      />

      {/* RUNNING banner */}
      {(isRunning || jobId) && (
        <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <Loader2 className="w-4 h-4 text-yellow-400 motion-safe:animate-spin shrink-0" />
          <p className="text-sm text-yellow-300">{t.payroll.runDetail.pollingMsg}</p>
        </div>
      )}

      {payslips.length > 0 && (
        <RunSummaryCards
          totals={totals}
          fmt={fmt}
          labels={{
            totalEarnings: t.payroll.runDetail.totalEarnings,
            totalDeductions: t.payroll.runDetail.totalDeductions,
            totalNet: t.payroll.runDetail.totalNet,
          }}
        />
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
        emptyDescription={isRunning ? t.payroll.runDetail.generatingMsg : isDraft ? t.payroll.runDetail.notCalculatedMsg : t.payroll.runDetail.noSlipsGenerated}
        emptyAction={
          isDraft && canEdit() ? (
            <button onClick={handleCalculate} disabled={isCalculating} className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
              {isCalculating ? <Loader2 className="w-4 h-4 motion-safe:animate-spin" /> : <Play className="w-4 h-4" />}
              {isCalculating ? t.payroll.runDetail.calculating : t.payroll.runDetail.calculateAction}
            </button>
          ) : undefined
        }
      />

      {signatures && signatures.total > 0 && (isCompleted || isClosed) && (
        <SignaturesDashboard
          signatures={signatures}
          localeId={localeId}
          labels={{
            signatures: t.payroll.runDetail.signatures,
            signaturesProg: t.payroll.runDetail.signaturesProg,
            employee: t.payroll.runDetail.employee,
            status: t.common.status,
            notes: t.common.notes,
            signedLabel: t.payroll.runDetail.signedLabel,
            pendingLabel: t.payroll.runDetail.pendingLabel,
            noComment: t.payroll.runDetail.noComment,
          }}
        />
      )}

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

      <PayslipDetailSheet
        selectedSlip={selectedSlip}
        slipLoading={slipLoading}
        isCompleted={!!isCompleted}
        isClosed={!!isClosed}
        canEditLines={canEdit()}
        editingLine={editingLine}
        editValue={editValue}
        isSavingLine={isSavingLine}
        isDownloadingSlipPdf={isDownloadingSlipPdf}
        localeId={localeId}
        fmt={fmt}
        onClose={() => { setSelectedSlip(null); setEditingLine(null); }}
        onStartEdit={(line: PayslipLine) => { setEditingLine(line.id); setEditValue(line.amount); }}
        onCancelEdit={() => setEditingLine(null)}
        onSaveEdit={handleSaveLine}
        onEditValueChange={setEditValue}
        onDownloadPdf={handleDownloadSlipPdf}
        labels={{
          earnings: t.payroll.runDetail.earnings,
          deductions: t.payroll.runDetail.deductions,
          gross: t.payroll.runDetail.gross,
          netPayable: t.payroll.runDetail.netPayable,
          signedLabel: t.payroll.runDetail.signedLabel,
          pendingLabel: t.payroll.runDetail.pendingLabel,
          signedAt: t.payroll.runDetail.signedAt,
          downloadPdf: t.payroll.runDetail.downloadPdf,
          downloadingPdf: t.payroll.runDetail.downloadingPdf,
          save: t.common.save,
          cancel: t.common.cancel,
          edit: t.common.edit,
        }}
      />
    </>
  );
}


