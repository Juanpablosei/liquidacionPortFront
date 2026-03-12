'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/utils/toast';
import { type ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Clock, Upload } from 'lucide-react';
import { listAttendance, createAttendance, updateAttendance, deleteAttendance } from '@/lib/api/attendance';
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

const INPUT_CLASS = 'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 focus:border-[#2563EB]/50 focus:ring-0';

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

  const empMap = Object.fromEntries(employees.map((e) => [e.id, `${e.lastName}, ${e.firstName}`]));

  function empName(rec: Attendance): string {
    if (rec.employee) return `${rec.employee.lastName}, ${rec.employee.firstName}`;
    return empMap[rec.employeeId] ?? '—';
  }

  const columns: ColumnDef<Attendance>[] = [
    {
      header: t.attendance.employee,
      cell: ({ row }) => (
        <span className="text-sm text-white">{empName(row.original)}</span>
      ),
    },
    {
      header: t.attendance.date,
      cell: ({ row }) => (
        <span className="font-mono text-slate-300 text-sm">{formatDate(row.original.date, localeId)}</span>
      ),
    },
    {
      header: t.attendance.checkIn,
      cell: ({ row }) => (
        <span className="font-mono text-slate-300 text-sm">{row.original.clockIn ?? '—'}</span>
      ),
    },
    {
      header: t.attendance.checkOut,
      cell: ({ row }) => (
        <span className="font-mono text-slate-300 text-sm">{row.original.clockOut ?? '—'}</span>
      ),
    },
    {
      header: t.attendance.worked,
      cell: ({ row }) => (
        <span className="font-mono text-slate-400 text-sm">{formatMinutes(row.original.workedMinutes)}</span>
      ),
    },
    {
      header: t.attendance.notes,
      cell: ({ row }) => (
        <span className="text-slate-400 text-sm truncate max-w-[120px] sm:max-w-[180px] block">{row.original.notes ?? '—'}</span>
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
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:outline-none"
              aria-label={t.common.edit}
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {canDelete() && (
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteItem(row.original); }}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:outline-none"
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
        <p className="text-slate-400 text-sm">{t.common.noPermission}</p>
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
              <Link
                href={ROUTES.attendanceImport(companyId)}
                className="inline-flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-300 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                <Upload className="w-4 h-4" />
                {t.attendance.importBtn}
              </Link>
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
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
          className="flex-1 min-w-0 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-[#2563EB]/50 transition-colors"
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
          className="px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-[#2563EB]/50 transition-colors"
        />
        <input
          type="date"
          value={filterTo}
          onChange={(e) => setFilterTo(e.target.value)}
          aria-label={t.common.to}
          className="px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-[#2563EB]/50 transition-colors"
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
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
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
          className="bg-[#060B16] border-l border-white/[0.08] text-white overflow-y-auto"
          style={{ width: 420, maxWidth: '100vw' }}
        >
          <SheetHeader className="pb-4 border-b border-white/[0.06]">
            <SheetTitle className="text-white">
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
                  <SelectContent className="bg-[#0F172A] border-white/[0.1] text-white">
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
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#2563EB]/50 transition-colors resize-none"
              />
            </FormField>

            <SheetFooter className="px-0 mt-2 flex-row gap-2">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors disabled:opacity-50"
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
    </>
  );
}
