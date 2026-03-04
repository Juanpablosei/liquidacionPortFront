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
} from 'lucide-react';
import {
  getRun,
  calculateRun,
  closeRun,
  listPayslips,
  getPayslip,
  patchPayslipLine,
  exportPayslipsCsv,
} from '@/lib/api/payroll';
import { ROUTES } from '@/lib/constants/routes';
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
import type { PayrollRun, Payslip, PayslipLine } from '@/lib/types/payroll';

const ARS = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

function fmt(v: string | number) {
  return ARS.format(typeof v === 'string' ? parseFloat(v) : v);
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function RunDetailPage() {
  const { companyId, runId } = useParams<{ companyId: string; runId: string }>();
  const { isManager, canEdit } = usePermissions();

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

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadRun = useCallback(async () => {
    if (!companyId || !runId) return;
    try {
      const r = await getRun(companyId, runId);
      setRun(r);
      return r;
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Error al cargar run');
    }
  }, [companyId, runId]);

  const loadPayslips = useCallback(async () => {
    if (!companyId || !runId) return;
    try {
      const ps = await listPayslips(companyId, runId);
      setPayslips(ps);
    } catch {
      // silently ignore if no payslips yet
    }
  }, [companyId, runId]);

  useEffect(() => {
    if (!companyId || !runId) return;
    setIsLoading(true);
    Promise.all([loadRun(), loadPayslips()])
      .finally(() => setIsLoading(false));
  }, [companyId, runId, loadRun, loadPayslips]);

  // Polling when RUNNING
  useEffect(() => {
    if (run?.status === 'RUNNING') {
      pollRef.current = setInterval(async () => {
        const updated = await loadRun();
        if (updated && updated.status !== 'RUNNING') {
          if (pollRef.current) clearInterval(pollRef.current);
          loadPayslips();
          toast.success('Cálculo completado');
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
        toast.success('Cálculo iniciado');
      }
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Error al calcular');
    } finally {
      setIsCalculating(false);
    }
  }

  async function handleClose() {
    setIsClosing(true);
    try {
      const updated = await closeRun(companyId, runId);
      setRun(updated);
      toast.success('Run cerrado');
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Error al cerrar run');
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
      toast.error((err as Error).message ?? 'Error al exportar');
    } finally {
      setIsExporting(false);
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
        toast.error('Error al cargar recibo');
      } finally {
        setSlipLoading(false);
      }
    }
  }

  async function handleSaveLine(payslipId: string, lineId: string) {
    setIsSavingLine(true);
    try {
      await patchPayslipLine(companyId, runId, payslipId, lineId, { amount: editValue });
      toast.success('Línea actualizada');
      setEditingLine(null);
      // Refresh the payslip detail
      const full = await getPayslip(companyId, runId, payslipId);
      setSelectedSlip(full);
      // Refresh payslips list
      loadPayslips();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Error al guardar');
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
      header: 'Empleado',
      cell: ({ row }) => {
        const e = row.original.employee;
        return (
          <span className="text-sm text-white font-medium">
            {e ? `${e.lastName}, ${e.firstName}` : `Empleado ${row.original.employeeId.slice(-6)}`}
          </span>
        );
      },
    },
    {
      header: 'Haberes',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-emerald-400">{fmt(row.original.grossPay)}</span>
      ),
    },
    {
      header: 'Deducciones',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-red-400">{fmt(row.original.totalDeductions)}</span>
      ),
    },
    {
      header: 'Neto',
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
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#93BBFC] transition-colors"
        >
          Ver detalle
          <ChevronRight className="w-3 h-3" />
        </button>
      ),
    },
  ];

  if (!isManager()) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400 text-sm">No tenés permisos para ver esta sección.</p>
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
        description={run?.runAt ? `Procesado: ${formatDateTime(run.runAt)}` : 'Sin procesar aún'}
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
                  {isCalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {isCalculating ? 'Iniciando...' : 'Calcular'}
                </button>
              )}

              {/* Close button — only COMPLETED */}
              {isCompleted && canEdit() && (
                <RoleGate roles={['OWNER', 'ADMIN']}>
                  <button
                    onClick={() => setCloseConfirm(true)}
                    className="inline-flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    <Lock className="w-4 h-4" />
                    Cerrar run
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
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {isExporting ? 'Exportando...' : 'CSV'}
                </button>
              )}
            </div>
          )
        }
      />

      {/* RUNNING banner */}
      {isRunning && (
        <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <Loader2 className="w-4 h-4 text-yellow-400 animate-spin shrink-0" />
          <p className="text-sm text-yellow-300">
            Calculando nómina… Esta página se actualizará automáticamente.
          </p>
        </div>
      )}

      {/* Summary cards */}
      {payslips.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total haberes',     value: totals.gross,      icon: <TrendingUp className="w-4 h-4" />,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Total deducciones', value: totals.deductions,  icon: <TrendingDown className="w-4 h-4" />, color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
            { label: 'Total neto',        value: totals.net,         icon: <DollarSign className="w-4 h-4" />,  color: 'text-white',       bg: 'bg-[#2563EB]/10 border-[#2563EB]/20' },
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
        emptyMessage={isRunning ? 'Calculando recibos…' : 'Sin recibos en este run'}
        emptyIcon={<FileText className="w-6 h-6" />}
        emptyDescription={
          isRunning
            ? 'Los recibos se están generando. La página se actualizará automáticamente.'
            : isDraft
            ? 'Este run aún no fue calculado. Presioná Calcular para generar los recibos.'
            : 'No se generaron recibos para este run.'
        }
        emptyAction={
          isDraft && canEdit() ? (
            <button
              onClick={handleCalculate}
              disabled={isCalculating}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isCalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isCalculating ? 'Iniciando...' : 'Calcular nómina'}
            </button>
          ) : undefined
        }
      />

      {/* Close run confirm */}
      <ConfirmDialog
        open={closeConfirm}
        onOpenChange={setCloseConfirm}
        onConfirm={handleClose}
        title="Cerrar run"
        description="Cerrar el run es irreversible. Los recibos quedarán bloqueados y no podrán editarse. ¿Confirmás?"
        confirmLabel="Cerrar run"
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
                    : 'Recibo de sueldo'}
                </SheetTitle>
              </SheetHeader>

              {slipLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
                </div>
              ) : (
                <div className="p-4 flex flex-col gap-4">
                  {/* Lines */}
                  <div>
                    {/* Earnings */}
                    <PayslipSection
                      title="Haberes"
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
                    />

                    {/* Deductions */}
                    <PayslipSection
                      title="Deducciones"
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
                    />
                  </div>

                  {/* Totals */}
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] divide-y divide-white/[0.05]">
                    <TotalRow label="Bruto"        value={selectedSlip.grossPay}        color="text-emerald-400" />
                    <TotalRow label="Deducciones"  value={selectedSlip.totalDeductions}  color="text-red-400" />
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm font-semibold text-white">Neto a pagar</span>
                      <span className="font-mono text-lg font-bold text-white">{fmt(selectedSlip.netPay)}</span>
                    </div>
                  </div>
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
          <div key={line.id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/[0.03] group">
            <div className="flex-1 min-w-0">
              <span className="text-xs font-mono text-slate-500 mr-1.5">{line.conceptCode}</span>
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
                  className="p-1 rounded text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                >
                  {isSavingLine ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                </button>
                <button
                  onClick={onCancelEdit}
                  className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className={`font-mono text-sm ${colorClass}`}>{fmt(line.amount)}</span>
                {canEdit && (
                  <button
                    onClick={() => onStartEdit(line)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-600 hover:text-white hover:bg-white/[0.06] transition-all"
                  >
                    <Pencil className="w-3 h-3" />
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

function TotalRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`font-mono text-sm ${color}`}>{fmt(value)}</span>
    </div>
  );
}
