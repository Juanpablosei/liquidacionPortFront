'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, Timer } from 'lucide-react';
import { listOvertime, createOvertime, updateOvertime, deleteOvertime } from '@/lib/api/overtime';
import { listEmployees } from '@/lib/api/employees';
import { overtimeSchema, type OvertimeInput } from '@/lib/validators/attendance';
import { ROUTES } from '@/lib/constants/routes';
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
import type { OvertimeEntry, OvertimeType } from '@/lib/types/attendance';
import type { Employee } from '@/lib/types/employee';

const INPUT_CLASS = 'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 focus:border-[#2563EB]/50 focus:ring-0';

const OT_TYPE_FILTER: { value: OvertimeType | ''; label: string }[] = [
  { value: '',       label: 'Todos los tipos' },
  { value: 'OT_50',  label: 'OT 50%' },
  { value: 'OT_100', label: 'OT 100%' },
];

function formatDate(d: string): string {
  const iso = d.includes('T') ? d : d + 'T00:00:00';
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export default function OvertimePage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { isManager, canEdit, canDelete } = usePermissions();

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

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<OvertimeInput>({
    resolver: zodResolver(overtimeSchema),
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
    })
      .then(setRecords)
      .catch((err: Error) => toast.error(err.message ?? 'Error al cargar horas extra'))
      .finally(() => setIsLoading(false));
  }, [companyId, filterEmp, filterFrom, filterTo, filterType]);

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
        toast.success('Hora extra actualizada');
      } else {
        await createOvertime(companyId, { employeeId: data.employeeId, ...base });
        toast.success('Hora extra registrada');
      }
      setSheetOpen(false);
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      await deleteOvertime(companyId, deleteItem.id);
      toast.success('Registro eliminado');
      setDeleteItem(null);
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Error al eliminar');
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
      header: 'Empleado',
      cell: ({ row }) => (
        <span className="text-sm text-white">{empName(row.original)}</span>
      ),
    },
    {
      header: 'Fecha',
      cell: ({ row }) => (
        <span className="font-mono text-slate-300 text-sm">{formatDate(row.original.date)}</span>
      ),
    },
    {
      header: 'Tipo',
      cell: ({ row }) => <StatusBadge status={row.original.overtimeType} />,
    },
    {
      header: 'Minutos',
      cell: ({ row }) => (
        <span className="font-mono text-slate-300 text-sm">{row.original.minutes} min</span>
      ),
    },
    {
      header: 'Notas',
      cell: ({ row }) => (
        <span className="text-slate-500 text-sm truncate max-w-[180px] block">{row.original.notes ?? '—'}</span>
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
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Editar"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {canDelete() && (
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteItem(row.original); }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
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

  return (
    <>
      <PageHeader
        title="Horas extra"
        description="Registros de tiempo extra del personal."
        backHref={ROUTES.company(companyId)}
        actions={
          <RoleGate roles={['OWNER', 'ADMIN']}>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Registrar
            </button>
          </RoleGate>
        }
      />

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <select
          value={filterEmp}
          onChange={(e) => setFilterEmp(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-[#2563EB]/50 transition-colors"
        >
          <option value="">Todos los empleados</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.lastName}, {e.firstName}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as OvertimeType | '')}
          className="px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-[#2563EB]/50 transition-colors"
        >
          {OT_TYPE_FILTER.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={filterFrom}
          onChange={(e) => setFilterFrom(e.target.value)}
          className="px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-[#2563EB]/50 transition-colors"
        />
        <input
          type="date"
          value={filterTo}
          onChange={(e) => setFilterTo(e.target.value)}
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
        emptyMessage="Sin registros de horas extra"
        emptyIcon={<Timer className="w-6 h-6" />}
        emptyDescription={
          filterEmp || filterFrom || filterTo || filterType
            ? 'No hay registros que coincidan con los filtros aplicados.'
            : 'Cuando un empleado trabaje fuera de horario, registralo aquí.'
        }
        emptyAction={
          canEdit() && !filterEmp && !filterFrom && !filterTo && !filterType ? (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Registrar hora extra
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
              {editItem ? 'Editar hora extra' : 'Registrar hora extra'}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
            {!editItem && (
              <FormField label="Empleado" name="employeeId" error={errors.employeeId?.message} required>
                <select
                  {...register('employeeId')}
                  className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-sm text-white focus:outline-none focus:border-[#2563EB]/50 transition-colors"
                >
                  <option value="">Seleccioná un empleado</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.lastName}, {e.firstName}</option>
                  ))}
                </select>
              </FormField>
            )}

            <FormField label="Fecha" name="date" error={errors.date?.message} required>
              <Input type="date" {...register('date')} className={INPUT_CLASS} />
            </FormField>

            <FormField label="Tipo" name="overtimeType" error={errors.overtimeType?.message} required>
              <div className="flex gap-2">
                {(['OT_50', 'OT_100'] as OvertimeType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setValue('overtimeType', t)}
                    className={[
                      'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                      watchedType === t
                        ? 'bg-[#2563EB]/20 border-[#2563EB]/50 text-[#93BBFC]'
                        : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white',
                    ].join(' ')}
                  >
                    {t === 'OT_50' ? 'OT 50%' : 'OT 100%'}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label="Minutos" name="minutes" error={errors.minutes?.message} required>
              <Input
                type="number"
                min={1}
                {...register('minutes', { valueAsNumber: true })}
                placeholder="Ej: 120"
                className={INPUT_CLASS}
              />
            </FormField>

            <FormField label="Notas" name="notes" error={errors.notes?.message}>
              <textarea
                {...register('notes')}
                rows={3}
                placeholder="Observaciones opcionales..."
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#2563EB]/50 transition-colors resize-none"
              />
            </FormField>

            <SheetFooter className="px-0 mt-2 flex-row gap-2">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => { if (!open) setDeleteItem(null); }}
        onConfirm={handleDelete}
        title="Eliminar hora extra"
        description="¿Estás seguro de que querés eliminar este registro? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
