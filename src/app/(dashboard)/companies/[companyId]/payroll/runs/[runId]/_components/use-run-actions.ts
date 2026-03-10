'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from '@/lib/utils/toast';
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
import { downloadBlob } from './payslip-columns';
import type { PayrollRun, Payslip, SignaturesSummary } from '@/lib/types/payroll';

interface RunLabels {
  loadError: string;
  calcCompleted: string;
  calculating: string;
  calcError: string;
  runClosed: string;
  closeError: string;
  exportError: string;
  pdfError: string;
  lineUpdated: string;
  lineSaveError: string;
}

export function useRunActions(companyId: string, runId: string, labels: RunLabels) {
  const [run,           setRun]           = useState<PayrollRun | null>(null);
  const [payslips,      setPayslips]      = useState<Payslip[]>([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isClosing,     setIsClosing]     = useState(false);
  const [isExporting,   setIsExporting]   = useState(false);
  const [closeConfirm,  setCloseConfirm]  = useState(false);
  const [selectedSlip,  setSelectedSlip]  = useState<Payslip | null>(null);
  const [slipLoading,   setSlipLoading]   = useState(false);
  const [editingLine,   setEditingLine]   = useState<string | null>(null);
  const [editValue,     setEditValue]     = useState('');
  const [isSavingLine,  setIsSavingLine]  = useState(false);
  const [signatures,    setSignatures]    = useState<SignaturesSummary | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isDownloadingSlipPdf, setIsDownloadingSlipPdf] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Data loading ─────────────────────────────────────────────────────── */

  const loadRun = useCallback(async () => {
    if (!companyId || !runId) return;
    try {
      const r = await getRun(companyId, runId);
      setRun(r);
      return r;
    } catch (err: unknown) {
      toast.error((err as Error).message ?? labels.loadError);
    }
  }, [companyId, runId, labels.loadError]);

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
      // silently ignore
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
          toast.success(labels.calcCompleted);
        }
      }, 3000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [run?.status, loadRun, loadPayslips, loadSignatures, labels.calcCompleted]);

  /* ── Action handlers ──────────────────────────────────────────────────── */

  async function handleCalculate() {
    setIsCalculating(true);
    try {
      const updated = await calculateRun(companyId, runId);
      setRun(updated);
      if (updated.status === 'COMPLETED' || updated.status === 'CLOSED') {
        await loadPayslips();
        toast.success(labels.calcCompleted);
      } else {
        toast.success(labels.calculating);
      }
    } catch (err: unknown) {
      toast.error((err as Error).message ?? labels.calcError);
    } finally {
      setIsCalculating(false);
    }
  }

  async function handleClose() {
    setIsClosing(true);
    try {
      const updated = await closeRun(companyId, runId);
      setRun(updated);
      toast.success(labels.runClosed);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? labels.closeError);
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
      toast.error((err as Error).message ?? labels.exportError);
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
      toast.error((err as Error).message ?? labels.pdfError);
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
      toast.error((err as Error).message ?? labels.pdfError);
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
        toast.error(labels.loadError);
      } finally {
        setSlipLoading(false);
      }
    }
  }

  async function handleSaveLine(payslipId: string, lineId: string) {
    setIsSavingLine(true);
    try {
      await patchPayslipLine(companyId, runId, payslipId, lineId, { amount: editValue });
      toast.success(labels.lineUpdated);
      setEditingLine(null);
      const full = await getPayslip(companyId, runId, payslipId);
      setSelectedSlip(full);
      loadPayslips();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? labels.lineSaveError);
    } finally {
      setIsSavingLine(false);
    }
  }

  return {
    // State
    run, payslips, isLoading, isCalculating, isClosing, isExporting,
    closeConfirm, setCloseConfirm, selectedSlip, setSelectedSlip,
    slipLoading, editingLine, setEditingLine, editValue, setEditValue,
    isSavingLine, signatures, isExportingPdf, isDownloadingSlipPdf,
    // Derived
    isClosed:    run?.status === 'CLOSED',
    isRunning:   run?.status === 'RUNNING',
    isCompleted: run?.status === 'COMPLETED',
    isDraft:     run?.status === 'DRAFT',
    // Handlers
    handleCalculate, handleClose, handleExport, handleExportPdf,
    handleDownloadSlipPdf, handleOpenPayslip, handleSaveLine,
  };
}
