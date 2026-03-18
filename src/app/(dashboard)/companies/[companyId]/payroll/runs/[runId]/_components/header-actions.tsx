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
        <button onClick={onCalculate} disabled={isCalculating} className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
          {isCalculating ? <Loader2 className="w-4 h-4 motion-safe:animate-spin" /> : <Play className="w-4 h-4" />}
          {isCalculating ? labels.calculating : labels.calculate}
        </button>
      )}

      {isCompleted && canEdit && (
        <RoleGate roles={['OWNER', 'ADMIN']}>
          <button onClick={onClose} disabled={isClosing} className="inline-flex items-center gap-2 bg-overlay hover:bg-overlay-strong border border-border text-foreground px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <Lock className="w-4 h-4" />
            {labels.closeRun}
          </button>
        </RoleGate>
      )}

      {(isCompleted || isClosed) && (
        <button onClick={onExport} disabled={isExporting} className="inline-flex items-center gap-2 bg-overlay-subtle hover:bg-overlay-strong border border-border text-muted-foreground hover:text-foreground px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
          {isExporting ? <Loader2 className="w-4 h-4 motion-safe:animate-spin" /> : <Download className="w-4 h-4" />}
          {isExporting ? labels.exporting : labels.export}
        </button>
      )}

      {(isCompleted || isClosed) && (
        <button onClick={onExportPdf} disabled={isExportingPdf} className="inline-flex items-center gap-2 bg-overlay-subtle hover:bg-overlay-strong border border-border text-muted-foreground hover:text-foreground px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
          {isExportingPdf ? <Loader2 className="w-4 h-4 motion-safe:animate-spin" /> : <FileText className="w-4 h-4" />}
          {isExportingPdf ? labels.exportingPdf : labels.exportPdf}
        </button>
      )}
    </div>
  );
}
