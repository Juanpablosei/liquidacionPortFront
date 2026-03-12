'use client';

import { useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { toast } from '@/lib/utils/toast';
import {
  Upload,
  Download,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { useTranslation } from '@/lib/i18n';
import {
  getAttendanceImportTemplate,
  importAttendance,
} from '@/lib/api/attendance';
import type { ImportAttendanceResult } from '@/lib/api/attendance';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils/cn';

const ACCEPTED = '.xlsx';

export default function AttendanceImportPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { isAdmin } = usePermissions();
  const t = useTranslation();

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [result, setResult] = useState<ImportAttendanceResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleFileSelect = useCallback((selected: File | null) => {
    if (!selected) return;
    if (!selected.name.endsWith('.xlsx')) {
      toast.error(t.attendance.dropzoneHint);
      return;
    }
    setFile(selected);
    setResult(null);
  }, [t.attendance.dropzoneHint]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0] ?? null;
      handleFileSelect(dropped);
    },
    [handleFileSelect],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files?.[0] ?? null);
      // reset so same file can be re-selected
      e.target.value = '';
    },
    [handleFileSelect],
  );

  async function handleDownloadTemplate() {
    setIsDownloading(true);
    try {
      const blob = await getAttendanceImportTemplate(companyId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'attendance-template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.attendance.importError);
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleImport() {
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await importAttendance(companyId, file);
      setResult(res);
      toast.success(t.attendance.importSuccess);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.attendance.importError);
    } finally {
      setIsUploading(false);
    }
  }

  // ── Permission guard ────────────────────────────────────────────────────────

  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400 text-sm">{t.common.noPermission}</p>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={t.attendance.importTitle}
        description={t.attendance.importDesc}
        backHref={ROUTES.attendance(companyId)}
      />

      {/* Template download */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={handleDownloadTemplate}
          disabled={isDownloading}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          {t.attendance.downloadTemplate}
        </Button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-colors duration-150 cursor-pointer',
          isDragging
            ? 'border-[#2563EB] bg-[#2563EB]/[0.06]'
            : 'border-white/[0.12] bg-white/[0.02] hover:border-white/[0.2] hover:bg-white/[0.04]',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED}
          onChange={handleInputChange}
          className="hidden"
        />

        {file ? (
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">{t.attendance.fileSelected}</p>
              <p className="text-xs text-slate-400">{file.name}</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setResult(null);
              }}
              aria-label={t.attendance.removeFile}
              className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-slate-500" />
            <p className="text-sm text-slate-300">{t.attendance.dropzoneText}</p>
            <p className="text-xs text-slate-500">{t.attendance.dropzoneHint}</p>
          </>
        )}
      </div>

      {/* Import button */}
      <div className="mt-4">
        <Button
          onClick={handleImport}
          disabled={!file || isUploading}
          className="gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
        >
          <Upload className="w-4 h-4" />
          {isUploading ? t.attendance.uploading : t.attendance.importBtn}
        </Button>
      </div>

      {/* Results */}
      {result && (
        <div className="mt-8 space-y-4">
          <h2 className="text-sm font-semibold text-white">
            {t.attendance.resultsTitle}
          </h2>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 p-4 flex flex-col items-center gap-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-lg font-semibold text-emerald-300 font-mono">
                {result.imported}
              </span>
              <span className="text-xs text-emerald-400/80">
                {t.attendance.importedCount}
              </span>
            </div>
            <div className="rounded-xl bg-yellow-500/[0.08] border border-yellow-500/20 p-4 flex flex-col items-center gap-1">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <span className="text-lg font-semibold text-yellow-300 font-mono">
                {result.skipped}
              </span>
              <span className="text-xs text-yellow-400/80">
                {t.attendance.skippedCount}
              </span>
            </div>
            <div className="rounded-xl bg-red-500/[0.08] border border-red-500/20 p-4 flex flex-col items-center gap-1">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-lg font-semibold text-red-300 font-mono">
                {result.errors.length}
              </span>
              <span className="text-xs text-red-400/80">
                {t.attendance.errorsCount}
              </span>
            </div>
          </div>

          {/* Skipped records table */}
          {result.skippedRecords.length > 0 && (
            <div className="rounded-xl border border-white/[0.08] overflow-hidden max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/[0.03] text-left text-slate-400">
                    <th className="px-4 py-2 font-medium">{t.attendance.row}</th>
                    <th className="px-4 py-2 font-medium">{t.attendance.documentNumber}</th>
                    <th className="px-4 py-2 font-medium">{t.attendance.date}</th>
                    <th className="px-4 py-2 font-medium">{t.attendance.reason}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.skippedRecords.map((rec) => (
                    <tr
                      key={`${rec.row}-${rec.documentNumber}`}
                      className="border-t border-white/[0.06] text-slate-300"
                    >
                      <td className="px-4 py-2 font-mono">{rec.row}</td>
                      <td className="px-4 py-2">{rec.documentNumber}</td>
                      <td className="px-4 py-2 font-mono">{rec.date}</td>
                      <td className="px-4 py-2 text-yellow-400/80">{rec.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Errors list */}
          {result.errors.length > 0 && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4 space-y-1">
              {result.errors.map((error, idx) => (
                <p key={idx} className="text-sm text-red-300 flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  {error}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
