'use client';

import {
  Play,
  Lock,
  Download,
  Loader2,
  FileText,
} from 'lucide-react';
import { StatusBadge } from '@/components/shared/status-badge';
import { RoleGate }    from '@/components/shared/role-gate';
import type { PayrollRun } from '@/lib/types/payroll';

interface HeaderActionsProps {
  run: PayrollRun;
  isDraft: boolean | undefined;
  isCompleted: boolean | undefined;
  isClosed: boolean | undefined;
  isCalculating: boolean;
  isClosing: boolean;
  isExporting: boolean;
  isExportingPdf: boolean;
  canEdit: boolean;
  onCalculate: () => void;
  onClose: () => void;
  onExport: () => void;
  onExportPdf: () => void;
  labels: {
    calculating: string;
    calculate: string;
    closeRun: string;
    exporting: string;
    export: string;
    exportingPdf: string;
    exportPdf: string;
  };
}

export function HeaderActions({
  run, isDraft, isCompleted, isClosed,
  isCalculating, isClosing, isExporting, isExportingPdf,
  canEdit, onCalculate, onClose, onExport, onExportPdf, labels,
}: HeaderActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <StatusBadge status={run.status} />

      {(isDraft || isCompleted) && canEdit && (
        <button onClick={onCalculate} disabled={isCalculating} className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
          {isCalculating ? <Loader2 className="w-4 h-4 motion-safe:animate-spin" /> : <Play className="w-4 h-4" />}
          {isCalculating ? labels.calculating : labels.calculate}
        </button>
      )}

      {isCompleted && canEdit && (
        <RoleGate roles={['OWNER', 'ADMIN']}>
          <button onClick={onClose} disabled={isClosing} className="inline-flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <Lock className="w-4 h-4" />
            {labels.closeRun}
          </button>
        </RoleGate>
      )}

      {(isCompleted || isClosed) && (
        <button onClick={onExport} disabled={isExporting} className="inline-flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-slate-300 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
          {isExporting ? <Loader2 className="w-4 h-4 motion-safe:animate-spin" /> : <Download className="w-4 h-4" />}
          {isExporting ? labels.exporting : labels.export}
        </button>
      )}

      {(isCompleted || isClosed) && (
        <button onClick={onExportPdf} disabled={isExportingPdf} className="inline-flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-slate-300 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
          {isExportingPdf ? <Loader2 className="w-4 h-4 motion-safe:animate-spin" /> : <FileText className="w-4 h-4" />}
          {isExportingPdf ? labels.exportingPdf : labels.exportPdf}
        </button>
      )}
    </div>
  );
}
