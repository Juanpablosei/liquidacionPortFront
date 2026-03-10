'use client';

import {
  Loader2,
  Pencil,
  Check,
  X,
  ClipboardCheck,
  Download,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { Payslip, PayslipLine } from '@/lib/types/payroll';

function formatDateTime(d: string, locale: string) {
  return new Date(d).toLocaleDateString(locale, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ─── PayslipSection ──────────────────────────────────────────────────────────

interface PayslipSectionProps {
  title: string;
  lines: PayslipLine[];
  color: 'emerald' | 'red';
  canEdit: boolean;
  editingLine: string | null;
  editValue: string;
  isSavingLine: boolean;
  onStartEdit: (line: PayslipLine) => void;
  onCancelEdit: () => void;
  onSaveEdit: (lineId: string) => void;
  onEditValueChange: (v: string) => void;
  fmt: (v: string | number) => string;
  labels: { save: string; cancel: string; edit: string };
}

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
}: PayslipSectionProps) {
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

// ─── TotalRow ────────────────────────────────────────────────────────────────

function TotalRow({ label, value, color, fmt: fmtFn }: { label: string; value: string; color: string; fmt: (v: string | number) => string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`font-mono text-sm ${color}`}>{fmtFn(value)}</span>
    </div>
  );
}

// ─── PayslipDetailSheet ──────────────────────────────────────────────────────

interface PayslipDetailSheetProps {
  selectedSlip: Payslip | null;
  slipLoading: boolean;
  isCompleted: boolean;
  isClosed: boolean;
  canEditLines: boolean;
  editingLine: string | null;
  editValue: string;
  isSavingLine: boolean;
  isDownloadingSlipPdf: boolean;
  localeId: string;
  fmt: (v: string | number) => string;
  onClose: () => void;
  onStartEdit: (line: PayslipLine) => void;
  onCancelEdit: () => void;
  onSaveEdit: (payslipId: string, lineId: string) => void;
  onEditValueChange: (v: string) => void;
  onDownloadPdf: (payslipId: string) => void;
  labels: {
    earnings: string;
    deductions: string;
    gross: string;
    netPayable: string;
    signedLabel: string;
    pendingLabel: string;
    signedAt: string;
    downloadPdf: string;
    downloadingPdf: string;
    save: string;
    cancel: string;
    edit: string;
  };
}

export function PayslipDetailSheet({
  selectedSlip,
  slipLoading,
  isCompleted,
  isClosed,
  canEditLines,
  editingLine,
  editValue,
  isSavingLine,
  isDownloadingSlipPdf,
  localeId,
  fmt,
  onClose,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditValueChange,
  onDownloadPdf,
  labels,
}: PayslipDetailSheetProps) {
  const lineEditable = isCompleted && canEditLines && !isClosed;

  return (
    <Sheet open={!!selectedSlip} onOpenChange={(o) => { if (!o) onClose(); }}>
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
                  : labels.earnings}
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
                  <PayslipSection
                    title={labels.earnings}
                    lines={(selectedSlip.lines ?? []).filter((l) => l.category === 'EARNING')}
                    color="emerald"
                    canEdit={lineEditable}
                    editingLine={editingLine}
                    editValue={editValue}
                    isSavingLine={isSavingLine}
                    onStartEdit={onStartEdit}
                    onCancelEdit={onCancelEdit}
                    onSaveEdit={(lineId) => onSaveEdit(selectedSlip.id, lineId)}
                    onEditValueChange={onEditValueChange}
                    fmt={fmt}
                    labels={{ save: labels.save, cancel: labels.cancel, edit: labels.edit }}
                  />

                  <PayslipSection
                    title={labels.deductions}
                    lines={(selectedSlip.lines ?? []).filter((l) => l.category === 'DEDUCTION')}
                    color="red"
                    canEdit={lineEditable}
                    editingLine={editingLine}
                    editValue={editValue}
                    isSavingLine={isSavingLine}
                    onStartEdit={onStartEdit}
                    onCancelEdit={onCancelEdit}
                    onSaveEdit={(lineId) => onSaveEdit(selectedSlip.id, lineId)}
                    onEditValueChange={onEditValueChange}
                    fmt={fmt}
                    labels={{ save: labels.save, cancel: labels.cancel, edit: labels.edit }}
                  />
                </div>

                {/* Totals */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] divide-y divide-white/[0.05]">
                  <TotalRow label={labels.gross} value={selectedSlip.grossPay} color="text-emerald-400" fmt={fmt} />
                  <TotalRow label={labels.deductions} value={selectedSlip.totalDeductions} color="text-red-400" fmt={fmt} />
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm font-semibold text-white">{labels.netPayable}</span>
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
                        {selectedSlip.signature ? labels.signedLabel : labels.pendingLabel}
                      </p>
                      {selectedSlip.signature?.signedAt && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {labels.signedAt.replace('{date}', formatDateTime(selectedSlip.signature.signedAt, localeId))}
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
                  onClick={() => onDownloadPdf(selectedSlip.id)}
                  disabled={isDownloadingSlipPdf}
                  className="w-full inline-flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isDownloadingSlipPdf ? <Loader2 className="w-4 h-4 motion-safe:animate-spin" /> : <Download className="w-4 h-4" />}
                  {isDownloadingSlipPdf ? labels.downloadingPdf : labels.downloadPdf}
                </button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
