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
  X,
  Plus,
  BookOpen,
  FileText,
  Loader2,
} from 'lucide-react';
import { getEmployee, updateEmployee, terminateEmployee } from '@/lib/api/employees';
import { listContracts, createContract, updateContract, getSchedule, listContractConcepts, assignContractConcepts, removeContractConcept } from '@/lib/api/contracts';
import type { ContractConcept } from '@/lib/api/contracts';
import { listConcepts } from '@/lib/api/concepts';
import { createSettlement, getSettlement } from '@/lib/api/settlements';
import type { Settlement, SettlementReason } from '@/lib/types/settlement';
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
import { useTranslation, useLocaleId } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Employee, Contract, ContractScheduleEntry } from '@/lib/types/employee';
import type { PayrollConcept } from '@/lib/types/payroll';
import type { Translations } from '@/lib/i18n/es';

const INPUT_CLASS = 'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 focus:border-[#2563EB]/50 focus:ring-0';

const DOC_TYPE_KEYS = ['CI', 'RUC', 'PASSPORT', 'OTHER'] as const;

function formatDate(dateStr: string | null, locale: string): string {
  if (!dateStr) return '\u2014';
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function EmployeeDetailPage() {
  const { companyId, employeeId } = useParams<{ companyId: string; employeeId: string }>();
  const { canEdit, canViewSalary } = usePermissions();
  const t = useTranslation();
  const localeId = useLocaleId();

  const [employee,  setEmployee]  = useState<Employee | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [activeSchedule, setActiveSchedule] = useState<ContractScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editMode,       setEditMode]       = useState(false);
  const [showNewContract, setShowNewContract] = useState(false);
  const [editContract,   setEditContract]   = useState<Contract | null>(null);
  const [showTerminate,  setShowTerminate]  = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [expandedContract, setExpandedContract] = useState<string | null>(null);

  // Concepts
  const [companyConcepts,     setCompanyConcepts]     = useState<PayrollConcept[]>([]);
  const [selectedConceptIds,  setSelectedConceptIds]  = useState<Set<string>>(new Set());
  const [useCustomConcepts,   setUseCustomConcepts]   = useState(false);
  const [contractConcepts,    setContractConcepts]    = useState<Record<string, ContractConcept[]>>({});
  const [loadingConcepts,     setLoadingConcepts]     = useState<string | null>(null);
  const [editConceptIds,      setEditConceptIds]      = useState<Set<string>>(new Set());
  const [editConceptsLoaded,  setEditConceptsLoaded]  = useState(false);

  // Settlement
  const [settlement,        setSettlement]        = useState<Settlement | null>(null);
  const [showSettlement,    setShowSettlement]    = useState(false);
  const [settlementReason,  setSettlementReason]  = useState<SettlementReason>('DISMISSAL');
  const [settlementDate,    setSettlementDate]    = useState('');
  const [generatingSettlement, setGeneratingSettlement] = useState(false);
  const [loadingSettlement, setLoadingSettlement] = useState(false);

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

      // Try to load existing settlement
      try {
        const s = await getSettlement(companyId, employeeId);
        setSettlement(s);
      } catch {
        setSettlement(null);
      }
    } catch (err: Error | unknown) {
      const msg = err instanceof Error ? err.message : t.employees.detail.loadError;
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, employeeId, t]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!companyId) return;
    listConcepts(companyId)
      .then((concepts) => setCompanyConcepts(concepts.filter((c) => c.isActive)))
      .catch(() => {});
  }, [companyId]);

  // --- Edit employee form ---
  const editForm = useForm<UpdateEmployeeInput>({
    resolver: zodResolver(updateEmployeeSchema(t.validators)),
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
      toast.success(t.employees.detail.updated);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.employees.detail.updateError);
    } finally {
      setSaving(false);
    }
  }

  // --- New contract form ---
  const contractForm = useForm<CreateContractInput>({
    resolver: zodResolver(createContractSchema(t.validators)),
    defaultValues: { salaryType: 'MONTHLY' },
  });

  async function onCreateContract(data: CreateContractInput) {
    setSaving(true);
    try {
      await createContract(companyId, employeeId, {
        ...data,
        endDate:    data.endDate || undefined,
        conceptIds: useCustomConcepts ? Array.from(selectedConceptIds) : undefined,
      });
      contractForm.reset({ salaryType: 'MONTHLY' });
      setShowNewContract(false);
      setUseCustomConcepts(false);
      setSelectedConceptIds(new Set());
      toast.success(t.employees.detail.contractCreated);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.employees.detail.contractError);
    } finally {
      setSaving(false);
    }
  }

  // --- Edit contract form ---
  const editContractForm = useForm<CreateContractInput>({
    resolver: zodResolver(createContractSchema(t.validators)),
  });

  useEffect(() => {
    if (editContract) {
      editContractForm.reset({
        startDate:    editContract.startDate,
        endDate:      editContract.endDate ?? '',
        salaryType:   editContract.salaryType as 'MONTHLY' | 'HOURLY',
        salaryAmount: String(editContract.salaryAmount ?? ''),
      });
      // Load this contract's concepts
      setEditConceptsLoaded(false);
      listContractConcepts(companyId, employeeId, editContract.id)
        .then((concepts) => {
          // The backend may return conceptId or id — collect both to match against companyConcepts
          const ids = new Set<string>();
          for (const c of concepts) {
            if (c.id) ids.add(c.id);
            const raw = c as unknown as Record<string, unknown>;
            if (raw.conceptId && typeof raw.conceptId === 'string') ids.add(raw.conceptId);
          }
          setEditConceptIds(ids);
          setEditConceptsLoaded(true);
        })
        .catch(() => {
          setEditConceptIds(new Set());
          setEditConceptsLoaded(true);
        });
    } else {
      setEditConceptIds(new Set());
      setEditConceptsLoaded(false);
    }
  }, [editContract, editContractForm, companyId, employeeId]);

  async function onUpdateContract(data: CreateContractInput) {
    if (!editContract) return;
    setSaving(true);
    try {
      await updateContract(companyId, employeeId, editContract.id, {
        startDate:    data.startDate,
        endDate:      data.endDate || undefined,
        salaryType:   data.salaryType,
        salaryAmount: data.salaryAmount,
      });

      // Sync concepts: get current, remove extras, add missing
      const current = await listContractConcepts(companyId, employeeId, editContract.id);
      const currentIds = new Set(current.map((c) => c.id));
      const desired = editConceptIds;

      const toRemove = current.filter((c) => !desired.has(c.id));
      const toAdd = Array.from(desired).filter((id) => !currentIds.has(id));

      await Promise.all(
        toRemove.map((c) => removeContractConcept(companyId, employeeId, editContract.id, c.id)),
      );
      if (toAdd.length > 0) {
        await assignContractConcepts(companyId, employeeId, editContract.id, toAdd);
      }

      // Clear cached concepts for this contract
      setContractConcepts((prev) => {
        const next = { ...prev };
        delete next[editContract.id];
        return next;
      });

      setEditContract(null);
      toast.success(t.employees.detail.contractUpdated);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.employees.detail.contractError);
    } finally {
      setSaving(false);
    }
  }

  // --- Terminate form ---
  const terminateForm = useForm<TerminateEmployeeInput>({
    resolver: zodResolver(terminateEmployeeSchema(t.validators)),
  });

  async function onTerminate(data: TerminateEmployeeInput) {
    setSaving(true);
    try {
      const updated = await terminateEmployee(companyId, employeeId, {
        terminationDate: data.terminationDate,
      });
      setEmployee(updated);
      setShowTerminate(false);
      toast.success(t.employees.detail.terminated);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.employees.detail.terminateError);
    } finally {
      setSaving(false);
    }
  }

  // --- Contract concepts ---
  async function loadContractConcepts(contractId: string) {
    setLoadingConcepts(contractId);
    try {
      const concepts = await listContractConcepts(companyId, employeeId, contractId);
      setContractConcepts((prev) => ({ ...prev, [contractId]: concepts }));
    } catch {
      setContractConcepts((prev) => ({ ...prev, [contractId]: [] }));
    } finally {
      setLoadingConcepts(null);
    }
  }

  async function handleAssignConcept(contractId: string, conceptId: string) {
    try {
      const updated = await assignContractConcepts(companyId, employeeId, contractId, [conceptId]);
      setContractConcepts((prev) => ({ ...prev, [contractId]: updated }));
      toast.success(t.employees.detail.conceptAssigned);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.employees.detail.conceptAssignError);
    }
  }

  async function handleRemoveConcept(contractId: string, conceptId: string) {
    try {
      await removeContractConcept(companyId, employeeId, contractId, conceptId);
      setContractConcepts((prev) => ({
        ...prev,
        [contractId]: (prev[contractId] ?? []).filter((c) => c.id !== conceptId),
      }));
      toast.success(t.employees.detail.conceptRemoved);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.employees.detail.conceptRemoveError);
    }
  }

  async function handleGenerateSettlement() {
    if (!settlementDate) return;
    setGeneratingSettlement(true);
    try {
      const s = await createSettlement(companyId, employeeId, {
        reason: settlementReason,
        terminationDate: settlementDate,
      });
      setSettlement(s);
      setShowSettlement(false);
      toast.success(t.settlements.create.generated);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setGeneratingSettlement(false);
    }
  }

  const docTypeLabels = t.employees.docTypes as Record<string, string>;

  // --- Contract table columns ---
  const contractColumns: ColumnDef<Contract>[] = [
    {
      header: t.common.type,
      cell: ({ row }) => <StatusBadge status={row.original.salaryType} />,
    },
    {
      header: t.employees.detail.startDate,
      cell: ({ row }) => (
        <span className="font-mono text-sm">{formatDate(row.original.startDate, localeId)}</span>
      ),
    },
    {
      header: t.employees.detail.endDate,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-slate-400">{formatDate(row.original.endDate, localeId)}</span>
      ),
    },
    {
      header: t.employees.detail.salary,
      cell: ({ row }) => (
        <CurrencyDisplay
          amount={row.original.salaryAmount}
          hidden={!canViewSalary()}
        />
      ),
    },
    {
      header: '',
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          {canEdit() && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditContract(row.original);
                setShowNewContract(false);
              }}
              aria-label={t.employees.detail.editContractLabel}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:outline-none"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpandedContract(
                expandedContract === row.original.id ? null : row.original.id,
              );
            }}
            aria-label={expandedContract === row.original.id ? t.employees.detail.collapseDetail : t.employees.detail.expandDetail}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-300 transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:outline-none"
          >
            {expandedContract === row.original.id
              ? <ChevronUp className="w-4 h-4" />
              : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
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
                  {t.common.edit}
                </button>
              )}
              {!settlement && (
                <button
                  onClick={() => setShowSettlement(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-sm text-slate-300 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {t.settlements.create.title}
                </button>
              )}
              {employee.isActive && (
                <button
                  onClick={() => setShowTerminate(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 rounded-xl text-sm text-red-400 transition-colors cursor-pointer"
                >
                  <UserX className="w-3.5 h-3.5" />
                  {t.employees.detail.terminate}
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
            <h2 className="text-sm font-semibold text-white mb-4">{t.employees.detail.personalData}</h2>

            {editMode ? (
              <form onSubmit={editForm.handleSubmit(onSaveEmployee)} className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <FormField
                    label={t.employees.detail.docTypeShort}
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
                        {DOC_TYPE_KEYS.map((key) => (
                          <SelectItem key={key} value={key} className="focus:bg-white/[0.06] focus:text-white">
                            {docTypeLabels[key] ?? key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label={t.employees.detail.document} name="documentNumber" error={editForm.formState.errors.documentNumber?.message} className="flex-1">
                    <Input {...editForm.register('documentNumber')} maxLength={20} className={INPUT_CLASS} />
                  </FormField>
                </div>

                <div className="flex gap-2">
                  <FormField label={t.employees.new.firstName} name="firstName" error={editForm.formState.errors.firstName?.message} className="flex-1">
                    <Input {...editForm.register('firstName')} maxLength={100} className={INPUT_CLASS} />
                  </FormField>
                  <FormField label={t.employees.new.lastName} name="lastName" error={editForm.formState.errors.lastName?.message} className="flex-1">
                    <Input {...editForm.register('lastName')} maxLength={100} className={INPUT_CLASS} />
                  </FormField>
                </div>

                <FormField label={t.employees.detail.hireDate} name="hireDate" error={editForm.formState.errors.hireDate?.message}>
                  <Input {...editForm.register('hireDate')} type="date" className={`${INPUT_CLASS} [color-scheme:dark]`} />
                </FormField>

                <FormField label={t.employees.new.email} name="email" error={editForm.formState.errors.email?.message}>
                  <Input {...editForm.register('email')} type="email" className={INPUT_CLASS} />
                </FormField>

                <FormField label={t.employees.detail.phone} name="phone" error={editForm.formState.errors.phone?.message}>
                  <Input {...editForm.register('phone')} type="tel" maxLength={20} className={INPUT_CLASS} />
                </FormField>

                <FormField label={t.employees.detail.birthDate} name="birthDate">
                  <Input {...editForm.register('birthDate')} type="date" className={`${INPUT_CLASS} [color-scheme:dark]`} />
                </FormField>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="flex-1 py-2 rounded-xl text-sm text-slate-400 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] transition-colors"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2 rounded-xl text-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 transition-colors"
                  >
                    {saving ? t.common.saving : t.common.save}
                  </button>
                </div>
              </form>
            ) : (
              <dl className="flex flex-col gap-3">
                <DataRow label={t.employees.detail.fullName} value={`${employee.firstName} ${employee.lastName}`} />
                <DataRow label={t.employees.detail.documentLabel} value={`${employee.documentType} ${employee.documentNumber}`} />
                <DataRow label={t.common.email} value={employee.email ?? '\u2014'} />
                <DataRow label={t.employees.detail.phone} value={employee.phone ?? '\u2014'} />
                <DataRow label={t.employees.detail.birthDate} value={formatDate(employee.birthDate, localeId)} />
                <DataRow label={t.employees.detail.hireDate} value={formatDate(employee.hireDate, localeId)} />
                {employee.terminationDate && (
                  <DataRow label={t.employees.detail.terminationDate} value={formatDate(employee.terminationDate, localeId)} highlight="danger" />
                )}
              </dl>
            )}
          </div>

          {/* Horario del contrato activo */}
          {activeContract && activeSchedule.length > 0 && (
            <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-5 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-white">{t.employees.detail.weeklySchedule}</h2>
              </div>
              <div className="flex flex-col gap-2">
                {activeSchedule
                  .sort((a, b) => a.weekday - b.weekday)
                  .map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400 w-8">
                        {t.employees.detail.weekdays[entry.weekday]}
                      </span>
                      <span className="text-xs text-slate-300 font-mono">
                        {entry.startTime} – {entry.endTime}
                      </span>
                      {entry.breakMinutes > 0 && (
                        <span className="text-xs text-slate-500">
                          {entry.breakMinutes}&apos; {t.employees.detail.breakMinutes}
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
              <h2 className="text-sm font-semibold text-white">{t.employees.detail.contractHistory}</h2>
              <span className="text-xs text-slate-500">({contracts.length})</span>
            </div>
            <RoleGate roles={['OWNER', 'ADMIN']}>
              <button
                onClick={() => setShowNewContract(!showNewContract)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-sm text-slate-300 transition-colors"
              >
                <FilePlus className="w-3.5 h-3.5" />
                {t.employees.detail.newContract}
              </button>
            </RoleGate>
          </div>

          {/* Formulario nuevo contrato (inline) */}
          {showNewContract && (
            <div className="bg-[#0F172A] border border-[#2563EB]/20 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">{t.employees.detail.newContract}</h3>
              <form onSubmit={contractForm.handleSubmit(onCreateContract)} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label={t.employees.detail.startDate} name="startDate" error={contractForm.formState.errors.startDate?.message} required>
                    <Input {...contractForm.register('startDate')} type="date" className={`${INPUT_CLASS} [color-scheme:dark]`} />
                  </FormField>
                  <FormField label={t.employees.detail.endDate} name="endDate" error={contractForm.formState.errors.endDate?.message} hint={t.employees.detail.indefiniteHint}>
                    <Input {...contractForm.register('endDate')} type="date" className={`${INPUT_CLASS} [color-scheme:dark]`} />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label={t.employees.detail.salaryType} name="salaryType" error={contractForm.formState.errors.salaryType?.message} required>
                    <Select
                      defaultValue="MONTHLY"
                      onValueChange={(v) => contractForm.setValue('salaryType', v as 'MONTHLY' | 'HOURLY', { shouldValidate: true })}
                    >
                      <SelectTrigger className={INPUT_CLASS}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0F172A] border-white/[0.1] text-white">
                        <SelectItem value="MONTHLY" className="focus:bg-white/[0.06] focus:text-white">{t.status.monthly}</SelectItem>
                        <SelectItem value="HOURLY"  className="focus:bg-white/[0.06] focus:text-white">{t.status.hourly}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label={t.employees.detail.amountLabel} name="salaryAmount" error={contractForm.formState.errors.salaryAmount?.message} required>
                    <Input
                      {...contractForm.register('salaryAmount')}
                      type="number"
                      min={0}
                      step="0.01"
                      max={99999999.99}
                      placeholder="Ej: 850000"
                      className={INPUT_CLASS}
                    />
                  </FormField>
                </div>

                {/* Conceptos */}
                {companyConcepts.length > 0 && (
                  <div className="border-t border-white/[0.06] pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useCustomConcepts}
                          onChange={(e) => {
                            setUseCustomConcepts(e.target.checked);
                            if (!e.target.checked) setSelectedConceptIds(new Set());
                          }}
                          className="w-4 h-4 rounded border-white/[0.2] bg-white/[0.05] text-[#2563EB] focus:ring-[#2563EB]/50"
                        />
                        <span className="text-xs text-slate-400">{t.employees.detail.chooseConceptsToggle}</span>
                      </label>
                    </div>
                    {!useCustomConcepts && (
                      <p className="text-xs text-slate-500">{t.employees.detail.autoAssignNote}</p>
                    )}
                    {useCustomConcepts && (
                      <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                        {companyConcepts.map((concept) => (
                          <label
                            key={concept.id}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedConceptIds.has(concept.id)}
                              onChange={(e) => {
                                const next = new Set(selectedConceptIds);
                                if (e.target.checked) next.add(concept.id);
                                else next.delete(concept.id);
                                setSelectedConceptIds(next);
                              }}
                              className="w-3.5 h-3.5 rounded border-white/[0.2] bg-white/[0.05] text-[#2563EB] focus:ring-[#2563EB]/50"
                            />
                            <span className="text-xs text-white flex-1">{concept.name}</span>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                              concept.category === 'EARNING'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {concept.category === 'EARNING' ? t.employees.detail.earningsShort : t.employees.detail.deductionsShort}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowNewContract(false); contractForm.reset({ salaryType: 'MONTHLY' }); setUseCustomConcepts(false); setSelectedConceptIds(new Set()); }}
                    className="flex-1 py-2 rounded-xl text-sm text-slate-400 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] transition-colors"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2 rounded-xl text-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 transition-colors"
                  >
                    {saving ? t.common.creating : t.employees.detail.createContract}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Formulario editar contrato (inline) */}
          {editContract && (
            <div className="bg-[#0F172A] border border-amber-500/20 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">{t.employees.detail.editContract}</h3>
              <form onSubmit={editContractForm.handleSubmit(onUpdateContract)} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label={t.employees.detail.startDate} name="edit-startDate" error={editContractForm.formState.errors.startDate?.message} required>
                    <Input {...editContractForm.register('startDate')} type="date" className={`${INPUT_CLASS} [color-scheme:dark]`} />
                  </FormField>
                  <FormField label={t.employees.detail.endDate} name="edit-endDate" error={editContractForm.formState.errors.endDate?.message} hint={t.employees.detail.indefiniteHint}>
                    <Input {...editContractForm.register('endDate')} type="date" className={`${INPUT_CLASS} [color-scheme:dark]`} />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label={t.employees.detail.salaryType} name="edit-salaryType" error={editContractForm.formState.errors.salaryType?.message} required>
                    <Select
                      value={editContractForm.watch('salaryType')}
                      onValueChange={(v) => editContractForm.setValue('salaryType', v as 'MONTHLY' | 'HOURLY', { shouldValidate: true })}
                    >
                      <SelectTrigger className={INPUT_CLASS}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0F172A] border-white/[0.1] text-white">
                        <SelectItem value="MONTHLY" className="focus:bg-white/[0.06] focus:text-white">{t.status.monthly}</SelectItem>
                        <SelectItem value="HOURLY"  className="focus:bg-white/[0.06] focus:text-white">{t.status.hourly}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label={t.employees.detail.amountLabel} name="edit-salaryAmount" error={editContractForm.formState.errors.salaryAmount?.message} required>
                    <Input
                      {...editContractForm.register('salaryAmount')}
                      type="number"
                      min={0}
                      step="0.01"
                      max={99999999.99}
                      placeholder="Ej: 850000"
                      className={INPUT_CLASS}
                    />
                  </FormField>
                </div>

                {/* Conceptos del contrato */}
                {companyConcepts.length > 0 && (
                  <div className="border-t border-white/[0.06] pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs font-medium text-slate-400">{t.employees.detail.assignedConcepts}</span>
                    </div>
                    {!editConceptsLoaded ? (
                      <p className="text-xs text-slate-600 motion-safe:animate-pulse">{t.employees.detail.loadingConcepts}</p>
                    ) : (
                      <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                        {companyConcepts.map((concept) => (
                          <label
                            key={concept.id}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={editConceptIds.has(concept.id)}
                              onChange={(e) => {
                                const next = new Set(editConceptIds);
                                if (e.target.checked) next.add(concept.id);
                                else next.delete(concept.id);
                                setEditConceptIds(next);
                              }}
                              className="w-3.5 h-3.5 rounded border-white/[0.2] bg-white/[0.05] text-[#2563EB] focus:ring-[#2563EB]/50"
                            />
                            <span className="text-xs text-white flex-1">{concept.name}</span>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                              concept.category === 'EARNING'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {concept.category === 'EARNING' ? t.employees.detail.earningsShort : t.employees.detail.deductionsShort}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditContract(null)}
                    className="flex-1 py-2 rounded-xl text-sm text-slate-400 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] transition-colors"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2 rounded-xl text-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 transition-colors"
                  >
                    {saving ? t.common.saving : t.employees.detail.saveChanges}
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
            emptyMessage={t.employees.detail.noContracts}
          />

          {/* Detalle expandido del contrato seleccionado */}
          {expandedContract && (() => {
            const ct = contracts.find((c) => c.id === expandedContract);
            if (!ct) return null;
            const ctConcepts = contractConcepts[ct.id];
            const hasSchedule = ct.weeklySchedule && ct.weeklySchedule.length > 0;

            // Load concepts if not loaded yet
            if (ctConcepts === undefined && loadingConcepts !== ct.id) {
              loadContractConcepts(ct.id);
            }

            const assignedIds = new Set((ctConcepts ?? []).map((c) => c.id));
            const unassigned = companyConcepts.filter((c) => !assignedIds.has(c.id));

            return (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-4">
                {/* Horario */}
                {hasSchedule && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-3">{t.employees.detail.contractSchedule}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ct.weeklySchedule!.sort((a, b) => a.weekday - b.weekday).map((e) => (
                        <div key={e.id} className="flex items-center gap-2 text-sm">
                          <span className="text-slate-500 w-8 text-xs font-medium">{t.employees.detail.weekdays[e.weekday]}</span>
                          <span className="text-slate-300 font-mono text-xs">{e.startTime}–{e.endTime}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conceptos asignados */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                    <p className="text-xs font-medium text-slate-500">{t.employees.detail.assignedConcepts}</p>
                  </div>

                  {loadingConcepts === ct.id ? (
                    <p className="text-xs text-slate-600 motion-safe:animate-pulse">{t.employees.detail.loadingConcepts}</p>
                  ) : ctConcepts && ctConcepts.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {ctConcepts.map((concept) => (
                        <span
                          key={concept.id}
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg border ${
                            concept.category === 'EARNING'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}
                        >
                          {concept.name}
                          {canEdit() && (
                            <button
                              onClick={() => handleRemoveConcept(ct.id, concept.id)}
                              aria-label={`${t.common.delete} ${concept.name}`}
                              className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-white transition-colors cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600">{t.employees.detail.noAssignedConcepts}</p>
                  )}

                  {/* Agregar conceptos */}
                  {canEdit() && unassigned.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/[0.04]">
                      <p className="text-[11px] text-slate-600 mb-2">{t.employees.detail.addConcept}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {unassigned.map((concept) => (
                          <button
                            key={concept.id}
                            onClick={() => handleAssignConcept(ct.id, concept.id)}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-white hover:border-white/[0.12] transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            {concept.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Settlement detail */}
      {settlement && (
        <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-6 mt-6">
          <div className="flex items-center gap-2 mb-5">
            <FileText className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-white">{t.settlements.detail.title}</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">{t.settlements.detail.reason}</p>
              <p className="text-sm font-medium text-white">
                {settlement.reason === 'DISMISSAL' ? t.settlements.detail.dismissal : t.settlements.detail.resignation}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">{t.settlements.detail.terminationDate}</p>
              <p className="text-sm font-medium text-white font-mono">
                {formatDate(settlement.terminationDate, localeId)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">{t.settlements.detail.hireDate}</p>
              <p className="text-sm font-medium text-white font-mono">
                {formatDate(settlement.hireDateSnapshot, localeId)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">{t.settlements.detail.seniority}</p>
              <p className="text-sm font-medium text-white">
                {t.settlements.detail.seniorityFormat
                  .replace('{years}', String(settlement.seniorityYears))
                  .replace('{months}', String(settlement.seniorityMonths))
                  .replace('{days}', String(settlement.seniorityDays))}
              </p>
            </div>
          </div>

          {canViewSalary() && (
            <>
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-0.5">{t.settlements.detail.dailySalary}</p>
                <CurrencyDisplay amount={settlement.dailySalary} />
              </div>

              {(() => {
                const payslip = settlement.run?.payslips?.[0];
                const lines = payslip?.lines;
                if (!lines || lines.length === 0) return null;
                return (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-3">{t.settlements.detail.lines}</p>
                    <div className="border border-white/[0.06] rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-white/[0.03]">
                            <th className="text-left text-xs font-medium text-slate-500 px-4 py-2">{t.settlements.detail.concept}</th>
                            <th className="text-left text-xs font-medium text-slate-500 px-4 py-2">{t.settlements.detail.category}</th>
                            <th className="text-right text-xs font-medium text-slate-500 px-4 py-2">{t.settlements.detail.amount}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lines.map((line, i) => (
                            <tr key={i} className="border-t border-white/[0.04]">
                              <td className="px-4 py-2.5 text-white">{line.conceptName}</td>
                              <td className="px-4 py-2.5">
                                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                  line.category === 'EARNING'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-red-500/10 text-red-400'
                                }`}>
                                  {line.category === 'EARNING' ? t.settlements.detail.earning : t.settlements.detail.deduction}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono">
                                <CurrencyDisplay amount={line.amount} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-white/[0.08] bg-white/[0.02]">
                            <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-white">{t.settlements.detail.total}</td>
                            <td className="px-4 py-3 text-right font-mono font-semibold">
                              <CurrencyDisplay amount={payslip.netPay} />
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* Modal: generar liquidación */}
      <Dialog open={showSettlement} onOpenChange={setShowSettlement}>
        <DialogContent className="bg-[#0F172A] border border-white/[0.08] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">{t.settlements.create.title}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {t.settlements.create.description}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-1.5">{t.settlements.create.reason}</label>
              <Select
                value={settlementReason}
                onValueChange={(v) => setSettlementReason(v as SettlementReason)}
              >
                <SelectTrigger className={INPUT_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0F172A] border-white/[0.1] text-white">
                  <SelectItem value="DISMISSAL" className="focus:bg-white/[0.06] focus:text-white">{t.settlements.create.dismissal}</SelectItem>
                  <SelectItem value="RESIGNATION" className="focus:bg-white/[0.06] focus:text-white">{t.settlements.create.resignation}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 block mb-1.5">{t.settlements.create.terminationDate}</label>
              <Input
                type="date"
                value={settlementDate}
                onChange={(e) => setSettlementDate(e.target.value)}
                className={`${INPUT_CLASS} [color-scheme:dark]`}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowSettlement(false)}
              disabled={generatingSettlement}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleGenerateSettlement}
              disabled={generatingSettlement || !settlementDate}
              aria-busy={generatingSettlement}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {generatingSettlement
                ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 motion-safe:animate-spin" />{t.settlements.create.generating}</span>
                : t.settlements.create.confirm}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: dar de baja */}
      <TerminateModal
        open={showTerminate}
        onOpenChange={setShowTerminate}
        onConfirm={terminateForm.handleSubmit(onTerminate)}
        isLoading={saving}
        form={terminateForm}
        t={t}
      />
    </>
  );
}

// --- Sub-componentes ---

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
  t,
}: {
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  onConfirm:     () => void;
  isLoading:     boolean;
  form:          ReturnType<typeof useForm<TerminateEmployeeInput>>;
  t:             Translations;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0F172A] border border-white/[0.08] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">{t.employees.detail.terminateTitle}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {t.employees.detail.terminateModalDesc}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <FormField
            label={t.employees.detail.terminateDate}
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
            {t.common.cancel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? t.common.processing : t.employees.detail.terminate}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmployeeSkeleton() {
  return (
    <div className="flex flex-col gap-6 motion-safe:animate-pulse">
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
