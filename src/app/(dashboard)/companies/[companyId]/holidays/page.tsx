'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, CalendarDays } from 'lucide-react';
import { listHolidays, createHoliday, updateHoliday, deleteHoliday } from '@/lib/api/holidays';
import { holidaySchema, type HolidayInput } from '@/lib/validators/attendance';
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
import type { Holiday } from '@/lib/types/attendance';

const INPUT_CLASS = 'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 focus:border-[#2563EB]/50 focus:ring-0';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 1 + i);

function formatDate(d: string, locale: string): string {
  const iso = d.includes('T') ? d : d + 'T00:00:00';
  return new Date(iso).toLocaleDateString(locale, {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export default function HolidaysPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { canEdit, canDelete } = usePermissions();
  const t = useTranslation();
  const localeId = useLocaleId();

  const [holidays,   setHolidays]   = useState<Holiday[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [year,       setYear]       = useState(CURRENT_YEAR);
  const [sheetOpen,  setSheetOpen]  = useState(false);
  const [editItem,   setEditItem]   = useState<Holiday | null>(null);
  const [deleteItem, setDeleteItem] = useState<Holiday | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving,   setIsSaving]   = useState(false);

  const schema = useMemo(() => holidaySchema(t.validators), [t.validators]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<HolidayInput>({
    resolver: zodResolver(schema),
    defaultValues: { isOptional: false },
  });

  const watchedOptional = watch('isOptional');

  const load = useCallback(() => {
    if (!companyId) return;
    setIsLoading(true);
    listHolidays(companyId, { year })
      .then(setHolidays)
      .catch((err: Error) => toast.error(err.message ?? t.holidays.saveError))
      .finally(() => setIsLoading(false));
  }, [companyId, year, t.holidays.saveError]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditItem(null);
    reset({ date: '', name: '', isOptional: false });
    setSheetOpen(true);
  }

  function openEdit(item: Holiday) {
    setEditItem(item);
    reset({ date: item.date, name: item.name, isOptional: item.isOptional });
    setSheetOpen(true);
  }

  async function onSubmit(data: HolidayInput) {
    setIsSaving(true);
    try {
      if (editItem) {
        await updateHoliday(companyId, editItem.id, data);
        toast.success(t.holidays.updated);
      } else {
        await createHoliday(companyId, data);
        toast.success(t.holidays.created);
      }
      setSheetOpen(false);
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.holidays.saveError);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      await deleteHoliday(companyId, deleteItem.id);
      toast.success(t.holidays.deleted);
      setDeleteItem(null);
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.holidays.deleteError);
    } finally {
      setIsDeleting(false);
    }
  }

  const columns: ColumnDef<Holiday>[] = [
    {
      header: t.holidays.date,
      cell: ({ row }) => (
        <span className="font-mono text-slate-300 text-sm">{formatDate(row.original.date, localeId)}</span>
      ),
    },
    {
      header: t.holidays.name,
      cell: ({ row }) => (
        <span className="text-sm text-white">{row.original.name}</span>
      ),
    },
    {
      header: t.holidays.type,
      cell: ({ row }) => (
        row.original.isOptional
          ? <StatusBadge status="inactive" label={t.holidays.optional} />
          : <StatusBadge status="active"   label={t.holidays.mandatory} />
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

  return (
    <>
      <PageHeader
        title={t.holidays.title}
        description={t.holidays.description}
        backHref={ROUTES.company(companyId)}
        actions={
          <RoleGate roles={['OWNER', 'ADMIN']}>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.holidays.addHoliday}
            </button>
          </RoleGate>
        }
      />

      {/* Filtro año */}
      <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 mb-5 w-fit">
        {YEAR_OPTIONS.map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            aria-pressed={year === y}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
              year === y
                ? 'bg-[#2563EB] text-white'
                : 'text-slate-400 hover:text-slate-300',
            ].join(' ')}
          >
            {y}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={holidays}
        total={holidays.length}
        page={1}
        limit={holidays.length || 1}
        isLoading={isLoading}
        onPageChange={() => {}}
        emptyMessage={t.holidays.emptyTitle.replace('{year}', String(year))}
        emptyIcon={<CalendarDays className="w-6 h-6" />}
        emptyDescription={t.holidays.emptyDesc}
        emptyAction={
          canEdit() ? (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.holidays.addHoliday}
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
              {editItem ? t.holidays.editTitle : t.holidays.createTitle}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
            <FormField label={t.holidays.date} name="date" error={errors.date?.message} required>
              <Input type="date" {...register('date')} className={INPUT_CLASS} />
            </FormField>

            <FormField label={t.holidays.name} name="name" error={errors.name?.message} required>
              <Input
                {...register('name')}
                maxLength={200}
                placeholder={t.holidays.namePlaceholder}
                className={INPUT_CLASS}
              />
            </FormField>

            <FormField label={t.holidays.type} name="isOptional" error={errors.isOptional?.message}>
              <div className="flex gap-2">
                {[
                  { value: false, label: t.holidays.mandatory },
                  { value: true,  label: t.holidays.optional },
                ].map((opt) => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => setValue('isOptional', opt.value)}
                    aria-pressed={watchedOptional === opt.value}
                    className={[
                      'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer',
                      watchedOptional === opt.value
                        ? 'bg-[#2563EB]/20 border-[#2563EB]/50 text-[#93BBFC]'
                        : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white',
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
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
        title={t.holidays.deleteTitle}
        description={t.holidays.deleteDesc}
        confirmLabel={t.common.delete}
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
