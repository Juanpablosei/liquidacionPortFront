'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { type ColumnDef } from '@tanstack/react-table';
import {
  UserX,
  FilePlus,
  Pencil,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getEmployee, updateEmployee, terminateEmployee } from '@/lib/api/employees';
import { listContracts, createContract, getSchedule } from '@/lib/api/contracts';
import {
  updateEmployeeSchema,
  createContractSchema,
  terminateEmployeeSchema,
  type UpdateEmployeeInput,
  type CreateContractInput,
  type TerminateEmployeeInput,
} from '@/lib/validators/employee';
import { ROUTES } from '@/lib/constants/routes';
import { PageHeader } from '@/components/shared/page-header';
import { FormField } from '@/components/shared/form-field';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { RoleGate } from '@/components/shared/role-gate';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Employee, Contract, ContractScheduleEntry } from '@/lib/types/employee';

const INPUT_CLASS = 'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 focus:border-[#2563EB]/50 focus:ring-0';

const WEEKDAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const DOCUMENT_TYPES = [
  { value: 'DNI',      label: 'DNI' },
  { value: 'CUIL',     label: 'CUIL' },
  { value: 'CUIT',     label: 'CUIT' },
  { value: 'PASSPORT', label: 'Pasaporte' },
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function EmployeeDetailPage() {
  const { companyId, employeeId } = useParams<{ companyId: string; employeeId: string }>();
  const { canEdit, canViewSalary } = usePermissions();

  const [employee,  setEmployee]  = useState<Employee | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [activeSchedule, setActiveSchedule] = useState<ContractScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editMode,       setEditMode]       = useState(false);
  const [showNewContract, setShowNewContract] = useState(false);
  const [showTerminate,  setShowTerminate]  = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [expandedContract, setExpandedContract] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId || !employeeId) return;
    setIsLoading(true);
    try {
      const [emp, cts] = await Promise.all([
        getEmployee(companyId, employeeId),
        listContracts(companyId, employeeId),
      ]);
      setEmployee(emp);
      setContracts(cts);

      const active = cts.find((c) => !c.endDate || new Date(c.endDate) >= new Date());
      if (active) {
        try {
          const sched = await getSchedule(companyId, employeeId, active.id);
          setActiveSchedule(sched);
        } catch {
          setActiveSchedule([]);
        }
      }
    } catch (err: Error | unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar el empleado';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, employeeId]);

  useEffect(() => { load(); }, [load]);

  // --- Edit employee form ---
  const editForm = useForm<UpdateEmployeeInput>({
    resolver: zodResolver(updateEmployeeSchema),
  });

  useEffect(() => {
    if (employee && editMode) {
      editForm.reset({
        documentType:   employee.documentType,
        documentNumber: employee.documentNumber,
        firstName:      employee.firstName,
        lastName:       employee.lastName,
        email:          employee.email ?? '',
        phone:          employee.phone ?? '',
        birthDate:      employee.birthDate ?? '',
        hireDate:       employee.hireDate,
      });
    }
  }, [employee, editMode, editForm]);

  async function onSaveEmployee(data: UpdateEmployeeInput) {
    if (!employee) return;
    setSaving(true);
    try {
      const updated = await updateEmployee(companyId, employeeId, {
        ...data,
        email:     data.email     || undefined,
        phone:     data.phone     || undefined,
        birthDate: data.birthDate || undefined,
      });
      setEmployee(updated);
      setEditMode(false);
      toast.success('Empleado actualizado');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  }

  // --- New contract form ---
  const contractForm = useForm<CreateContractInput>({
    resolver: zodResolver(createContractSchema),
    defaultValues: { salaryType: 'MONTHLY' },
  });

  async function onCreateContract(data: CreateContractInput) {
    setSaving(true);
    try {
      await createContract(companyId, employeeId, {
        ...data,
        endDate: data.endDate || undefined,
      });
      contractForm.reset({ salaryType: 'MONTHLY' });
      setShowNewContract(false);
      toast.success('Contrato creado');
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al crear contrato');
    } finally {
      setSaving(false);
    }
  }

  // --- Terminate form ---
  const terminateForm = useForm<TerminateEmployeeInput>({
    resolver: zodResolver(terminateEmployeeSchema),
  });

  async function onTerminate(data: TerminateEmployeeInput) {
    setSaving(true);
    try {
      const updated = await terminateEmployee(companyId, employeeId, {
        terminationDate: data.terminationDate,
      });
      setEmployee(updated);
      setShowTerminate(false);
      toast.success('Empleado dado de baja');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al dar de baja');
    } finally {
      setSaving(false);
    }
  }

  // --- Contract table columns ---
  const contractColumns: ColumnDef<Contract>[] = [
    {
      header: 'Tipo',
      cell: ({ row }) => <StatusBadge status={row.original.salaryType} />,
    },
    {
      header: 'Inicio',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{formatDate(row.original.startDate)}</span>
      ),
    },
    {
      header: 'Fin',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-slate-400">{formatDate(row.original.endDate)}</span>
      ),
    },
    {
      header: 'Salario',
      cell: ({ row }) => (
        <CurrencyDisplay
          amount={row.original.salaryAmount}
          hidden={!canViewSalary()}
        />
      ),
    },
    {
      header: '',
      id: 'expand',
      cell: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpandedContract(
              expandedContract === row.original.id ? null : row.original.id,
            );
          }}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          {expandedContract === row.original.id
            ? <ChevronUp className="w-4 h-4" />
            : <ChevronDown className="w-4 h-4" />}
        </button>
      ),
    },
  ];

  if (isLoading) return <EmployeeSkeleton />;
  if (!employee) return null;

  const activeContract = contracts.find((c) => !c.endDate || new Date(c.endDate) >= new Date());

  return (
    <>
      <PageHeader
        title={`${employee.lastName}, ${employee.firstName}`}
        description={`${employee.documentType} ${employee.documentNumber}`}
        backHref={ROUTES.employees(companyId)}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={employee.isActive ? 'active' : 'inactive'} />
            <RoleGate roles={['OWNER', 'ADMIN']}>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-sm text-slate-300 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </button>
              )}
              {employee.isActive && (
                <button
                  onClick={() => setShowTerminate(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 rounded-xl text-sm text-red-400 transition-colors"
                >
                  <UserX className="w-3.5 h-3.5" />
                  Dar de baja
                </button>
              )}
            </RoleGate>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Datos personales */}
        <div className="lg:col-span-1">
          <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Datos personales</h2>

            {editMode ? (
              <form onSubmit={editForm.handleSubmit(onSaveEmployee)} className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <FormField
                    label="Tipo doc."
                    name="documentType"
                    error={editForm.formState.errors.documentType?.message}
                    className="w-32 shrink-0"
                  >
                    <Select
                      defaultValue={employee.documentType}
                      onValueChange={(v) => editForm.setValue('documentType', v, { shouldValidate: true })}
                    >
                      <SelectTrigger className={INPUT_CLASS}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0F172A] border-white/[0.1] text-white">
                        {DOCUMENT_TYPES.map((dt) => (
                          <SelectItem key={dt.value} value={dt.value} className="focus:bg-white/[0.06] focus:text-white">
                            {dt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Número" name="documentNumber" error={editForm.formState.errors.documentNumber?.message} className="flex-1">
                    <Input {...editForm.register('documentNumber')} className={INPUT_CLASS} />
                  </FormField>
                </div>

                <div className="flex gap-2">
                  <FormField label="Nombre" name="firstName" error={editForm.formState.errors.firstName?.message} className="flex-1">
                    <Input {...editForm.register('firstName')} className={INPUT_CLASS} />
                  </FormField>
                  <FormField label="Apellido" name="lastName" error={editForm.formState.errors.lastName?.message} className="flex-1">
                    <Input {...editForm.register('lastName')} className={INPUT_CLASS} />
                  </FormField>
                </div>

                <FormField label="Fecha de ingreso" name="hireDate" error={editForm.formState.errors.hireDate?.message}>
                  <Input {...editForm.register('hireDate')} type="date" className={`${INPUT_CLASS} [color-scheme:dark]`} />
                </FormField>

                <FormField label="Email" name="email" error={editForm.formState.errors.email?.message}>
                  <Input {...editForm.register('email')} type="email" className={INPUT_CLASS} />
                </FormField>

                <FormField label="Teléfono" name="phone" error={editForm.formState.errors.phone?.message}>
                  <Input {...editForm.register('phone')} className={INPUT_CLASS} />
                </FormField>

                <FormField label="Fecha de nacimiento" name="birthDate">
                  <Input {...editForm.register('birthDate')} type="date" className={`${INPUT_CLASS} [color-scheme:dark]`} />
                </FormField>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="flex-1 py-2 rounded-xl text-sm text-slate-400 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2 rounded-xl text-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 transition-colors"
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            ) : (
              <dl className="flex flex-col gap-3">
                <DataRow label="Nombre completo" value={`${employee.firstName} ${employee.lastName}`} />
                <DataRow label="Documento" value={`${employee.documentType} ${employee.documentNumber}`} />
                <DataRow label="Email" value={employee.email ?? '—'} />
                <DataRow label="Teléfono" value={employee.phone ?? '—'} />
                <DataRow label="Fecha de nacimiento" value={formatDate(employee.birthDate)} />
                <DataRow label="Fecha de ingreso" value={formatDate(employee.hireDate)} />
                {employee.terminationDate && (
                  <DataRow label="Fecha de baja" value={formatDate(employee.terminationDate)} highlight="danger" />
                )}
              </dl>
            )}
          </div>

          {/* Horario del contrato activo */}
          {activeContract && activeSchedule.length > 0 && (
            <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-5 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-white">Horario semanal</h2>
              </div>
              <div className="flex flex-col gap-2">
                {activeSchedule
                  .sort((a, b) => a.weekday - b.weekday)
                  .map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400 w-8">
                        {WEEKDAY_NAMES[entry.weekday]}
                      </span>
                      <span className="text-xs text-slate-300 font-mono">
                        {entry.startTime} – {entry.endTime}
                      </span>
                      {entry.breakMinutes > 0 && (
                        <span className="text-xs text-slate-500">
                          {entry.breakMinutes}' pausa
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Contratos */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-white">Historial de contratos</h2>
              <span className="text-xs text-slate-500">({contracts.length})</span>
            </div>
            <RoleGate roles={['OWNER', 'ADMIN']}>
              <button
                onClick={() => setShowNewContract(!showNewContract)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-sm text-slate-300 transition-colors"
              >
                <FilePlus className="w-3.5 h-3.5" />
                Nuevo contrato
              </button>
            </RoleGate>
          </div>

          {/* Formulario nuevo contrato (inline) */}
          {showNewContract && (
            <div className="bg-[#0F172A] border border-[#2563EB]/20 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Nuevo contrato</h3>
              <form onSubmit={contractForm.handleSubmit(onCreateContract)} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Fecha de inicio" name="startDate" error={contractForm.formState.errors.startDate?.message} required>
                    <Input {...contractForm.register('startDate')} type="date" className={`${INPUT_CLASS} [color-scheme:dark]`} />
                  </FormField>
                  <FormField label="Fecha de fin" name="endDate" error={contractForm.formState.errors.endDate?.message} hint="Opcional (contrato indefinido)">
                    <Input {...contractForm.register('endDate')} type="date" className={`${INPUT_CLASS} [color-scheme:dark]`} />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Tipo de salario" name="salaryType" error={contractForm.formState.errors.salaryType?.message} required>
                    <Select
                      defaultValue="MONTHLY"
                      onValueChange={(v) => contractForm.setValue('salaryType', v as 'MONTHLY' | 'HOURLY', { shouldValidate: true })}
                    >
                      <SelectTrigger className={INPUT_CLASS}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0F172A] border-white/[0.1] text-white">
                        <SelectItem value="MONTHLY" className="focus:bg-white/[0.06] focus:text-white">Mensual</SelectItem>
                        <SelectItem value="HOURLY"  className="focus:bg-white/[0.06] focus:text-white">Por hora</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Monto ($)" name="salaryAmount" error={contractForm.formState.errors.salaryAmount?.message} required>
                    <Input
                      {...contractForm.register('salaryAmount')}
                      placeholder="Ej: 850000"
                      className={INPUT_CLASS}
                    />
                  </FormField>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowNewContract(false); contractForm.reset({ salaryType: 'MONTHLY' }); }}
                    className="flex-1 py-2 rounded-xl text-sm text-slate-400 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2 rounded-xl text-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 transition-colors"
                  >
                    {saving ? 'Creando...' : 'Crear contrato'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tabla de contratos */}
          <DataTable
            columns={contractColumns}
            data={contracts}
            total={contracts.length}
            page={1}
            limit={contracts.length || 1}
            isLoading={isLoading}
            onPageChange={() => {}}
            emptyMessage="Sin contratos registrados."
          />

          {/* Detalle expandido del contrato seleccionado */}
          {expandedContract && (() => {
            const ct = contracts.find((c) => c.id === expandedContract);
            if (!ct?.weeklySchedule?.length) return null;
            return (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                <p className="text-xs font-medium text-slate-500 mb-3">Horario del contrato</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ct.weeklySchedule.sort((a, b) => a.weekday - b.weekday).map((e) => (
                    <div key={e.id} className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500 w-8 text-xs font-medium">{WEEKDAY_NAMES[e.weekday]}</span>
                      <span className="text-slate-300 font-mono text-xs">{e.startTime}–{e.endTime}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Modal: dar de baja */}
      <TerminateModal
        open={showTerminate}
        onOpenChange={setShowTerminate}
        onConfirm={terminateForm.handleSubmit(onTerminate)}
        isLoading={saving}
        form={terminateForm}
      />
    </>
  );
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function DataRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: 'danger';
}) {
  return (
    <div>
      <dt className="text-xs text-slate-500 mb-0.5">{label}</dt>
      <dd className={`text-sm font-medium ${highlight === 'danger' ? 'text-red-400' : 'text-white'}`}>
        {value}
      </dd>
    </div>
  );
}

function TerminateModal({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  form,
}: {
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  onConfirm:     () => void;
  isLoading:     boolean;
  form:          ReturnType<typeof useForm<TerminateEmployeeInput>>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0F172A] border border-white/[0.08] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Dar de baja al empleado</DialogTitle>
          <DialogDescription className="text-slate-400">
            Esta acción marca al empleado como inactivo. El historial de contratos, asistencias y recibos se mantiene.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <FormField
            label="Fecha de baja"
            name="terminationDate"
            error={form.formState.errors.terminationDate?.message}
            required
          >
            <Input
              {...form.register('terminationDate')}
              type="date"
              className="bg-white/[0.05] border-white/[0.1] text-white [color-scheme:dark] focus:border-red-500/50 focus:ring-0"
            />
          </FormField>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Procesando...' : 'Dar de baja'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmployeeSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/[0.06]" />
          <div>
            <div className="h-5 bg-white/[0.06] rounded w-48 mb-2" />
            <div className="h-3 bg-white/[0.04] rounded w-32" />
          </div>
        </div>
        <div className="h-8 w-24 bg-white/[0.06] rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white/[0.03] rounded-xl p-5 h-64" />
        <div className="lg:col-span-2 bg-white/[0.03] rounded-xl p-5 h-64" />
      </div>
    </div>
  );
}
