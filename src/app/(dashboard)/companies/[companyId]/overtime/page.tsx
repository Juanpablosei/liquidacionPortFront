'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/utils/toast';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, Timer } from 'lucide-react';
import { listOvertime, createOvertime, updateOvertime, deleteOvertime } from '@/lib/api/overtime';
import { listEmployees } from '@/lib/api/employees';
import { overtimeSchema, type OvertimeInput } from '@/lib/validators/attendance';
import { ROUTES } from '@/lib/constants/routes';
import { useTranslation, useLocaleId } from '@/lib/i18n';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { FormField } from '@/components/shared/form-field';
import { StatusBadge } from '@/components/shared/status-badge';
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
import type { OvertimeEntry, OvertimeType } from '@/lib/types/attendance';
import type { Employee } from '@/lib/types/employee';

const INPUT_CLASS = 'bg-overlay border-border text-foreground placeholder:text-muted-foreground focus:border-brand/50 focus:ring-0';

function formatDate(d: string, locale: string): string {
  const iso = d.includes('T') ? d : d + 'T00:00:00';
  return new Date(iso).toLocaleDateString(locale, {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export default function OvertimePage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { isManager, canEdit, canDelete } = usePermissions();
  const t = useTranslation();
  const localeId = useLocaleId();

  const OT_TYPE_FILTER: { value: OvertimeType | ''; label: string }[] = [
    { value: '',       label: t.overtime.allTypes },
    { value: 'OT_50',  label: t.overtime.ot50 },
    { value: 'OT_100', label: t.overtime.ot100 },
  ];

  const [employees,   setEmployees]   = useState<Employee[]>([]);
  const [records,     setRecords]     = useState<OvertimeEntry[]>([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [filterEmp,   setFilterEmp]   = useState('');
  const [filterFrom,  setFilterFrom]  = useState('');
  const [filterTo,    setFilterTo]    = useState('');
  const [filterType,  setFilterType]  = useState<OvertimeType | ''>('');
  const [sheetOpen,   setSheetOpen]   = useState(false);
  const [editItem,    setEditItem]    = useState<OvertimeEntry | null>(null);
  const [deleteItem,  setDeleteItem]  = useState<OvertimeEntry | null>(null);
  const [isDeleting,  setIsDeleting]  = useState(false);
  const [isSaving,    setIsSaving]    = useState(false);

  const schema = useMemo(() => overtimeSchema(t.validators), [t.validators]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<OvertimeInput>({
    resolver: zodResolver(schema),
    defaultValues: { overtimeType: 'OT_50' },
  });

  const watchedType = watch('overtimeType');

  useEffect(() => {
    if (!companyId) return;
    listEmployees(companyId, { limit: 100, isActive: true })
      .then((res) => setEmployees(res.items))
      .catch(() => {});
  }, [companyId]);

  const load = useCallback(() => {
    if (!companyId) return;
    setIsLoading(true);
    listOvertime(companyId, {
      employeeId: filterEmp  || undefined,
      fromDate:   filterFrom || undefined,
      toDate:     filterTo   || undefined,
      type:       filterType || undefined,
      limit:      100,
    })
      .then((res) => setRecords(res.items))
      .catch((err: Error) => toast.error(err.message ?? t.overtime.saveError))
      .finally(() => setIsLoading(false));
  }, [companyId, filterEmp, filterFrom, filterTo, filterType, t.overtime.saveError]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditItem(null);
    reset({ employeeId: '', date: '', overtimeType: 'OT_50', minutes: undefined, notes: '' });
    setSheetOpen(true);
  }

  function openEdit(item: OvertimeEntry) {
    setEditItem(item);
    reset({
      employeeId:   item.employeeId,
      date:         item.date,
      overtimeType: item.overtimeType,
      minutes:      item.minutes,
      notes:        item.notes ?? '',
    });
    setSheetOpen(true);
  }

  async function onSubmit(data: OvertimeInput) {
    setIsSaving(true);
    try {
      const base = {
        date:         data.date,
        overtimeType: data.overtimeType,
        minutes:      Number(data.minutes),
        notes:        data.notes || undefined,
      };
      if (editItem) {
        await updateOvertime(companyId, editItem.id, base);
        toast.success(t.overtime.updated);
      } else {
        await createOvertime(companyId, { employeeId: data.employeeId, ...base });
        toast.success(t.overtime.created);
      }
      setSheetOpen(false);
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.overtime.saveError);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      await deleteOvertime(companyId, deleteItem.id);
      toast.success(t.overtime.deleted);
      setDeleteItem(null);
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.overtime.deleteError);
    } finally {
      setIsDeleting(false);
    }
  }

  const empMap = Object.fromEntries(employees.map((e) => [e.id, `${e.lastName}, ${e.firstName}`]));

  function empName(rec: OvertimeEntry): string {
    if (rec.employee) return `${rec.employee.lastName}, ${rec.employee.firstName}`;
    return empMap[rec.employeeId] ?? '—';
  }

  const columns: ColumnDef<OvertimeEntry>[] = [
    {
      header: t.overtime.employee,
      cell: ({ row }) => (
        <span className="text-sm text-foreground">{empName(row.original)}</span>
      ),
    },
    {
      header: t.overtime.date,
      cell: ({ row }) => (
        <span className="font-mono text-muted-foreground text-sm">{formatDate(row.original.date, localeId)}</span>
      ),
    },
    {
      header: t.overtime.type,
      cell: ({ row }) => <StatusBadge status={row.original.overtimeType} />,
    },
    {
      header: t.overtime.minutes,
      cell: ({ row }) => (
        <span className="font-mono text-muted-foreground text-sm">{row.original.minutes} min</span>
      ),
    },
    {
      header: t.overtime.notes,
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
        title={t.overtime.title}
        description={t.overtime.description}
        backHref={ROUTES.company(companyId)}
        actions={
          <RoleGate roles={['OWNER', 'ADMIN']}>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.overtime.register}
            </button>
          </RoleGate>
        }
      />

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <select
          value={filterEmp}
          onChange={(e) => setFilterEmp(e.target.value)}
          aria-label={t.overtime.employee}
          className="flex-1 min-w-0 px-3 py-2 bg-overlay-subtle border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-brand/50 transition-colors"
        >
          <option value="">{t.overtime.allEmployees}</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.lastName}, {e.firstName}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as OvertimeType | '')}
          aria-label={t.overtime.type}
          className="px-3 py-2 bg-overlay-subtle border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-brand/50 transition-colors"
        >
          {OT_TYPE_FILTER.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
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
          aria-label={t.common.from}
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
        emptyMessage={t.overtime.emptyTitle}
        emptyIcon={<Timer className="w-6 h-6" />}
        emptyDescription={
          filterEmp || filterFrom || filterTo || filterType
            ? t.overtime.emptyFilter
            : t.overtime.emptyDesc
        }
        emptyAction={
          canEdit() && !filterEmp && !filterFrom && !filterTo && !filterType ? (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.overtime.emptyAction}
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
              {editItem ? t.overtime.editTitle : t.overtime.createTitle}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
            {!editItem && (
              <FormField label={t.overtime.employee} name="employeeId" error={errors.employeeId?.message} required>
                <Select
                  onValueChange={(v) => setValue('employeeId', v, { shouldValidate: true })}
                >
                  <SelectTrigger className={INPUT_CLASS}>
                    <SelectValue placeholder={t.overtime.selectEmployee} />
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

            <FormField label={t.overtime.date} name="date" error={errors.date?.message} required>
              <Input type="date" {...register('date')} className={INPUT_CLASS} />
            </FormField>

            <FormField label={t.overtime.type} name="overtimeType" error={errors.overtimeType?.message} required>
              <div className="flex gap-2">
                {(['OT_50', 'OT_100'] as OvertimeType[]).map((ot) => (
                  <button
                    key={ot}
                    type="button"
                    onClick={() => setValue('overtimeType', ot)}
                    aria-pressed={watchedType === ot}
                    className={[
                      'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer',
                      watchedType === ot
                        ? 'bg-brand/20 border-brand/50 text-brand-text'
                        : 'bg-overlay-subtle border-border text-muted-foreground hover:text-foreground',
                    ].join(' ')}
                  >
                    {ot === 'OT_50' ? t.overtime.ot50 : t.overtime.ot100}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label={t.overtime.minutes} name="minutes" error={errors.minutes?.message} required>
              <Input
                type="number"
                min={1}
                max={1440}
                {...register('minutes', { valueAsNumber: true })}
                placeholder={t.overtime.minutesPlaceholder}
                className={INPUT_CLASS}
              />
            </FormField>

            <FormField label={t.overtime.notes} name="notes" error={errors.notes?.message}>
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
        title={t.overtime.deleteTitle}
        description={t.overtime.deleteDesc}
        confirmLabel={t.common.delete}
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
