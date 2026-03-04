'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, Clock } from 'lucide-react';
import { listAttendance, createAttendance, updateAttendance, deleteAttendance } from '@/lib/api/attendance';
import { listEmployees } from '@/lib/api/employees';
import { attendanceSchema, type AttendanceInput } from '@/lib/validators/attendance';
import { ROUTES } from '@/lib/constants/routes';
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
import type { Attendance } from '@/lib/types/attendance';
import type { Employee } from '@/lib/types/employee';

const INPUT_CLASS = 'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 focus:border-[#2563EB]/50 focus:ring-0';

function formatDate(d: string): string {
  const iso = d.includes('T') ? d : d + 'T00:00:00';
  return new Date(iso).toLocaleDateString('es-AR', {
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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AttendanceInput>({
    resolver: zodResolver(attendanceSchema),
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
    })
      .then(setRecords)
      .catch((err: Error) => toast.error(err.message ?? 'Error al cargar asistencias'))
      .finally(() => setIsLoading(false));
  }, [companyId, filterEmp, filterFrom, filterTo]);

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
        toast.success('Asistencia actualizada');
      } else {
        await createAttendance(companyId, { employeeId: data.employeeId, ...base });
        toast.success('Asistencia registrada');
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
      await deleteAttendance(companyId, deleteItem.id);
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

  function empName(rec: Attendance): string {
    if (rec.employee) return `${rec.employee.lastName}, ${rec.employee.firstName}`;
    return empMap[rec.employeeId] ?? '—';
  }

  const columns: ColumnDef<Attendance>[] = [
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
      header: 'Entrada',
      cell: ({ row }) => (
        <span className="font-mono text-slate-300 text-sm">{row.original.clockIn ?? '—'}</span>
      ),
    },
    {
      header: 'Salida',
      cell: ({ row }) => (
        <span className="font-mono text-slate-300 text-sm">{row.original.clockOut ?? '—'}</span>
      ),
    },
    {
      header: 'Trabajado',
      cell: ({ row }) => (
        <span className="font-mono text-slate-400 text-sm">{formatMinutes(row.original.workedMinutes)}</span>
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
        title="Asistencia"
        description="Registros de entrada y salida del personal."
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
        emptyMessage="Sin registros de asistencia"
        emptyIcon={<Clock className="w-6 h-6" />}
        emptyDescription={
          filterEmp || filterFrom || filterTo
            ? 'No hay registros que coincidan con los filtros aplicados.'
            : 'Empezá registrando la entrada y salida de tus empleados.'
        }
        emptyAction={
          canEdit() && !filterEmp && !filterFrom && !filterTo ? (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Registrar asistencia
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
              {editItem ? 'Editar asistencia' : 'Registrar asistencia'}
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

            <FormField label="Entrada" name="clockIn" error={errors.clockIn?.message}>
              <Input type="time" {...register('clockIn')} className={INPUT_CLASS} />
            </FormField>

            <FormField label="Salida" name="clockOut" error={errors.clockOut?.message}>
              <Input type="time" {...register('clockOut')} className={INPUT_CLASS} />
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
        title="Eliminar asistencia"
        description="¿Estás seguro de que querés eliminar este registro? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
