'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/utils/toast';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, Clock, Upload, Download, FileSpreadsheet, X, CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { listAttendance, createAttendance, updateAttendance, deleteAttendance, getAttendanceImportTemplate, importAttendance } from '@/lib/api/attendance';
import type { ImportAttendanceResult } from '@/lib/api/attendance';
import { cn } from '@/lib/utils/cn';
import { listEmployees } from '@/lib/api/employees';
import { attendanceSchema, type AttendanceInput } from '@/lib/validators/attendance';
import { ROUTES } from '@/lib/constants/routes';
import { useTranslation, useLocaleId } from '@/lib/i18n';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { FormField } from '@/components/shared/form-field';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { RoleGate } from '@/components/shared/role-gate';
import { usePermissions } from '@/lib/hooks/use-permissions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Attendance } from '@/lib/types/attendance';
import type { Employee } from '@/lib/types/employee';

const INPUT_CLASS = 'bg-overlay border-border text-foreground placeholder:text-muted-foreground focus:border-brand/50 focus:ring-0';

function formatDate(d: string, locale: string): string {
  const iso = d.includes('T') ? d : d + 'T00:00:00';
  return new Date(iso).toLocaleDateString(locale, {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function formatMinutes(min: number | null): string {
  if (min == null) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}m`;
}

export default function AttendancePage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { isManager, canEdit, canDelete } = usePermissions();
  const t = useTranslation();
  const localeId = useLocaleId();

  const [employees,  setEmployees]  = useState<Employee[]>([]);
  const [records,    setRecords]    = useState<Attendance[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [filterEmp,  setFilterEmp]  = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo,   setFilterTo]   = useState('');
  const [sheetOpen,  setSheetOpen]  = useState(false);
  const [editItem,   setEditItem]   = useState<Attendance | null>(null);
  const [deleteItem, setDeleteItem] = useState<Attendance | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving,   setIsSaving]   = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [importResult, setImportResult] = useState<ImportAttendanceResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const schema = useMemo(() => attendanceSchema(t.validators), [t.validators]);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<AttendanceInput>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!companyId) return;
    listEmployees(companyId, { limit: 100, isActive: true })
      .then((res) => setEmployees(res.items))
      .catch(() => {});
  }, [companyId]);

  const load = useCallback(() => {
    if (!companyId) return;
    setIsLoading(true);
    listAttendance(companyId, {
      employeeId: filterEmp  || undefined,
      fromDate:   filterFrom || undefined,
      toDate:     filterTo   || undefined,
      limit:      100,
    })
      .then((res) => setRecords(res.items))
      .catch((err: Error) => toast.error(err.message ?? t.attendance.saveError))
      .finally(() => setIsLoading(false));
  }, [companyId, filterEmp, filterFrom, filterTo, t.attendance.saveError]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditItem(null);
    reset({ employeeId: '', date: '', clockIn: '', clockOut: '', notes: '' });
    setSheetOpen(true);
  }

  function openEdit(item: Attendance) {
    setEditItem(item);
    reset({
      employeeId: item.employeeId,
      date:       item.date,
      clockIn:    item.clockIn  ?? '',
      clockOut:   item.clockOut ?? '',
      notes:      item.notes    ?? '',
    });
    setSheetOpen(true);
  }

  async function onSubmit(data: AttendanceInput) {
    setIsSaving(true);
    try {
      const base = {
        date:     data.date,
        clockIn:  data.clockIn  || undefined,
        clockOut: data.clockOut || undefined,
        notes:    data.notes    || undefined,
      };
      if (editItem) {
        await updateAttendance(companyId, editItem.id, base);
        toast.success(t.attendance.updated);
      } else {
        await createAttendance(companyId, { employeeId: data.employeeId, ...base });
        toast.success(t.attendance.created);
      }
      setSheetOpen(false);
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.attendance.saveError);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      await deleteAttendance(companyId, deleteItem.id);
      toast.success(t.attendance.deleted);
      setDeleteItem(null);
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.attendance.deleteError);
    } finally {
      setIsDeleting(false);
    }
  }

  const handleFileSelect = useCallback((selected: File | null) => {
    if (!selected) return;
    if (!selected.name.endsWith('.xlsx')) {
      toast.error(t.attendance.dropzoneHint);
      return;
    }
    setImportFile(selected);
    setImportResult(null);
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
      handleFileSelect(e.dataTransfer.files[0] ?? null);
    },
    [handleFileSelect],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files?.[0] ?? null);
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
    if (!importFile) return;
    setIsUploading(true);
    try {
      const res = await importAttendance(companyId, importFile);
      setImportResult(res);
      toast.success(t.attendance.importSuccess);
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.attendance.importError);
    } finally {
      setIsUploading(false);
    }
  }

  function openImportDialog() {
    setImportFile(null);
    setImportResult(null);
    setImportOpen(true);
  }

  const empMap = Object.fromEntries(employees.map((e) => [e.id, `${e.lastName}, ${e.firstName}`]));

  function empName(rec: Attendance): string {
    if (rec.employee) return `${rec.employee.lastName}, ${rec.employee.firstName}`;
    return empMap[rec.employeeId] ?? '—';
  }

  const columns: ColumnDef<Attendance>[] = [
    {
      header: t.attendance.employee,
      cell: ({ row }) => (
        <span className="text-sm text-foreground">{empName(row.original)}</span>
      ),
    },
    {
      header: t.attendance.date,
      cell: ({ row }) => (
        <span className="font-mono text-muted-foreground text-sm">{formatDate(row.original.date, localeId)}</span>
      ),
    },
    {
      header: t.attendance.checkIn,
      cell: ({ row }) => (
        <span className="font-mono text-muted-foreground text-sm">{row.original.clockIn ?? '—'}</span>
      ),
    },
    {
      header: t.attendance.checkOut,
      cell: ({ row }) => (
        <span className="font-mono text-muted-foreground text-sm">{row.original.clockOut ?? '—'}</span>
      ),
    },
    {
      header: t.attendance.worked,
      cell: ({ row }) => (
        <span className="font-mono text-muted-foreground text-sm">{formatMinutes(row.original.workedMinutes)}</span>
      ),
    },
    {
      header: t.attendance.notes,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm truncate max-w-[120px] sm:max-w-[180px] block">{row.original.notes ?? '—'}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          {canEdit() && (
            <button
              onClick={(e) => { e.stopPropagation(); openEdit(row.original); }}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-overlay transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
              aria-label={t.common.edit}
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {canDelete() && (
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteItem(row.original); }}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/[0.06] transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
              aria-label={t.common.delete}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (!isManager()) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground text-sm">{t.common.noPermission}</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={t.attendance.title}
        description={t.attendance.description}
        backHref={ROUTES.company(companyId)}
        actions={
          <RoleGate roles={['OWNER', 'ADMIN']}>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadTemplate}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 bg-overlay-subtle hover:bg-overlay-strong border border-border text-muted-foreground hover:text-foreground px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {t.attendance.downloadTemplate}
              </button>
              <button
                onClick={openImportDialog}
                className="inline-flex items-center gap-2 bg-overlay-subtle hover:bg-overlay-strong border border-border text-muted-foreground hover:text-foreground px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                <Upload className="w-4 h-4" />
                {t.attendance.importBtn}
              </button>
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t.attendance.register}
              </button>
            </div>
          </RoleGate>
        }
      />

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <select
          value={filterEmp}
          onChange={(e) => setFilterEmp(e.target.value)}
          aria-label={t.attendance.employee}
          className="flex-1 min-w-0 px-3 py-2 bg-overlay-subtle border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-brand/50 transition-colors"
        >
          <option value="">{t.attendance.allEmployees}</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.lastName}, {e.firstName}</option>
          ))}
        </select>
        <input
          type="date"
          value={filterFrom}
          onChange={(e) => setFilterFrom(e.target.value)}
          aria-label={t.common.from}
          className="px-3 py-2 bg-overlay-subtle border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-brand/50 transition-colors"
        />
        <input
          type="date"
          value={filterTo}
          onChange={(e) => setFilterTo(e.target.value)}
          aria-label={t.common.to}
          className="px-3 py-2 bg-overlay-subtle border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-brand/50 transition-colors"
        />
      </div>

      <DataTable
        columns={columns}
        data={records}
        total={records.length}
        page={1}
        limit={records.length || 1}
        isLoading={isLoading}
        onPageChange={() => {}}
        emptyMessage={t.attendance.emptyTitle}
        emptyIcon={<Clock className="w-6 h-6" />}
        emptyDescription={
          filterEmp || filterFrom || filterTo
            ? t.attendance.emptyFilter
            : t.attendance.emptyDesc
        }
        emptyAction={
          canEdit() && !filterEmp && !filterFrom && !filterTo ? (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.attendance.emptyAction}
            </button>
          ) : undefined
        }
      />

      {/* Sheet crear/editar */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          className="bg-sidebar border-l border-border text-foreground overflow-y-auto"
          style={{ width: 420, maxWidth: '100vw' }}
        >
          <SheetHeader className="pb-4 border-b border-border">
            <SheetTitle className="text-foreground">
              {editItem ? t.attendance.editTitle : t.attendance.createTitle}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
            {!editItem && (
              <FormField label={t.attendance.employee} name="employeeId" error={errors.employeeId?.message} required>
                <Select
                  onValueChange={(v) => setValue('employeeId', v, { shouldValidate: true })}
                >
                  <SelectTrigger className={INPUT_CLASS}>
                    <SelectValue placeholder={t.attendance.selectEmployee} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.lastName}, {e.firstName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            )}

            <FormField label={t.attendance.date} name="date" error={errors.date?.message} required>
              <Input type="date" {...register('date')} className={INPUT_CLASS} />
            </FormField>

            <FormField label={t.attendance.checkIn} name="clockIn" error={errors.clockIn?.message}>
              <Input type="time" {...register('clockIn')} className={INPUT_CLASS} />
            </FormField>

            <FormField label={t.attendance.checkOut} name="clockOut" error={errors.clockOut?.message}>
              <Input type="time" {...register('clockOut')} className={INPUT_CLASS} />
            </FormField>

            <FormField label={t.attendance.notes} name="notes" error={errors.notes?.message}>
              <textarea
                id="notes"
                {...register('notes')}
                rows={3}
                maxLength={500}
                placeholder={t.common.notesPlaceholder}
                className="w-full px-3 py-2 bg-overlay border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand/50 transition-colors resize-none"
              />
            </FormField>

            <SheetFooter className="px-0 mt-2 flex-row gap-2">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground bg-overlay-subtle hover:bg-overlay-strong border border-border transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-brand hover:bg-brand-hover text-white transition-colors disabled:opacity-50"
              >
                {isSaving ? t.common.saving : t.common.save}
              </button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => { if (!open) setDeleteItem(null); }}
        onConfirm={handleDelete}
        title={t.attendance.deleteTitle}
        description={t.attendance.deleteDesc}
        confirmLabel={t.common.delete}
        variant="danger"
        isLoading={isDeleting}
      />

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="bg-sidebar border-border text-foreground sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t.attendance.importTitle}</DialogTitle>
            <p className="text-sm text-muted-foreground">{t.attendance.importDesc}</p>
          </DialogHeader>

          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors duration-150 cursor-pointer',
              isDragging
                ? 'border-brand bg-brand/[0.06]'
                : 'border-border bg-overlay-subtle hover:border-border hover:bg-overlay-subtle',
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={handleInputChange}
              className="hidden"
            />

            {importFile ? (
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t.attendance.fileSelected}</p>
                  <p className="text-xs text-muted-foreground">{importFile.name}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImportFile(null);
                    setImportResult(null);
                  }}
                  aria-label={t.attendance.removeFile}
                  className="ml-2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-overlay-strong transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t.attendance.dropzoneText}</p>
                <p className="text-xs text-muted-foreground">{t.attendance.dropzoneHint}</p>
              </>
            )}
          </div>

          {/* Import button */}
          <button
            onClick={handleImport}
            disabled={!importFile || isUploading}
            className="w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isUploading ? t.attendance.uploading : t.attendance.importBtn}
          </button>

          {/* Results */}
          {importResult && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                {t.attendance.resultsTitle}
              </h3>

              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 p-3 flex flex-col items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-base font-semibold text-emerald-300 font-mono">{importResult.imported}</span>
                  <span className="text-[11px] text-emerald-400/80">{t.attendance.importedCount}</span>
                </div>
                <div className="rounded-xl bg-yellow-500/[0.08] border border-yellow-500/20 p-3 flex flex-col items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-base font-semibold text-yellow-300 font-mono">{importResult.skipped}</span>
                  <span className="text-[11px] text-yellow-400/80">{t.attendance.skippedCount}</span>
                </div>
                <div className="rounded-xl bg-red-500/[0.08] border border-red-500/20 p-3 flex flex-col items-center gap-1">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-base font-semibold text-red-300 font-mono">{importResult.errors.length}</span>
                  <span className="text-[11px] text-red-400/80">{t.attendance.errorsCount}</span>
                </div>
              </div>

              {/* Skipped records table */}
              {importResult.skippedRecords.length > 0 && (
                <div className="rounded-xl border border-border overflow-hidden max-h-[250px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-overlay-subtle text-left text-muted-foreground">
                        <th className="px-3 py-2 font-medium">{t.attendance.row}</th>
                        <th className="px-3 py-2 font-medium">{t.attendance.documentNumber}</th>
                        <th className="px-3 py-2 font-medium">{t.attendance.date}</th>
                        <th className="px-3 py-2 font-medium">{t.attendance.reason}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.skippedRecords.map((rec) => (
                        <tr key={`${rec.row}-${rec.documentNumber}`} className="border-t border-border text-muted-foreground">
                          <td className="px-3 py-2 font-mono">{rec.row}</td>
                          <td className="px-3 py-2">{rec.documentNumber}</td>
                          <td className="px-3 py-2 font-mono">{rec.date}</td>
                          <td className="px-3 py-2 text-yellow-400/80">{rec.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Errors list */}
              {importResult.errors.length > 0 && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-3 space-y-1">
                  {importResult.errors.map((error, idx) => (
                    <p key={idx} className="text-sm text-red-300 flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      {error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
