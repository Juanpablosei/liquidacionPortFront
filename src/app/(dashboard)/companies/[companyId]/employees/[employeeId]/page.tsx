'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/utils/toast';
import { UserX, Pencil, FileText } from 'lucide-react';
import { getEmployee, updateEmployee, terminateEmployee } from '@/lib/api/employees';
import { listContracts, createContract, updateContract, getSchedule, listContractConcepts, assignContractConcepts, removeContractConcept } from '@/lib/api/contracts';
import { listCompanyConvenios, assignConvenio } from '@/lib/api/convenios';
import type { Convenio } from '@/lib/types/convenio';
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
import { StatusBadge } from '@/components/shared/status-badge';
import { RoleGate } from '@/components/shared/role-gate';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { useTranslation, useLocaleId } from '@/lib/i18n';
import type { Employee, Contract, ContractScheduleEntry } from '@/lib/types/employee';
import type { PayrollConcept } from '@/lib/types/payroll';

import { EmployeeSkeleton, TerminateModal } from './_components/shared';
import { PersonalDataCard } from './_components/personal-data-card';
import { ContractSection } from './_components/contract-section';
import { ConvenioSection } from './_components/convenio-section';
import { SettlementDetail, SettlementModal } from './_components/settlement-section';

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

  // Convenio assignment
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [selectedConvenioId, setSelectedConvenioId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [editingConvenio, setEditingConvenio] = useState(false);
  const [savingConvenio, setSavingConvenio] = useState(false);

  // --- Data loading ---
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

      const s = await getSettlement(companyId, employeeId);
      setSettlement(s);
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

  useEffect(() => {
    if (!companyId) return;
    listCompanyConvenios(companyId)
      .then((res) => setConvenios([...res.own, ...res.global]))
      .catch(() => {});
  }, [companyId]);

  useEffect(() => {
    if (editingConvenio && employee) {
      setSelectedConvenioId(employee.convenioId ?? '');
      setSelectedCategoryId(employee.convenioCategoryId ?? '');
    }
  }, [editingConvenio, employee]);

  // --- Forms ---
  const editForm = useForm<UpdateEmployeeInput>({
    resolver: zodResolver(updateEmployeeSchema(t.validators)),
  });

  const contractForm = useForm<CreateContractInput>({
    resolver: zodResolver(createContractSchema(t.validators)),
    defaultValues: { salaryType: 'MONTHLY' },
  });

  const editContractForm = useForm<CreateContractInput>({
    resolver: zodResolver(createContractSchema(t.validators)),
  });

  const terminateForm = useForm<TerminateEmployeeInput>({
    resolver: zodResolver(terminateEmployeeSchema(t.validators)),
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

  useEffect(() => {
    if (editContract) {
      editContractForm.reset({
        startDate:    editContract.startDate,
        endDate:      editContract.endDate ?? '',
        salaryType:   editContract.salaryType as 'MONTHLY' | 'HOURLY',
        salaryAmount: String(editContract.salaryAmount ?? ''),
      });
      setEditConceptsLoaded(false);
      listContractConcepts(companyId, employeeId, editContract.id)
        .then((concepts) => {
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

  // --- Handlers ---
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

  async function loadContractConceptsHandler(contractId: string) {
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

  async function onSaveConvenio() {
    if (!employee) return;
    setSavingConvenio(true);
    try {
      await assignConvenio(companyId, employeeId, {
        convenioId: selectedConvenioId || null,
        convenioCategoryId: selectedCategoryId || null,
      });
      toast.success(t.convenios.assigned);
      setEditingConvenio(false);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.convenios.assignError);
    } finally {
      setSavingConvenio(false);
    }
  }

  async function onClearConvenio() {
    if (!employee) return;
    setSavingConvenio(true);
    try {
      await assignConvenio(companyId, employeeId, {
        convenioId: null,
        convenioCategoryId: null,
      });
      toast.success(t.convenios.assigned);
      setEditingConvenio(false);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.convenios.assignError);
    } finally {
      setSavingConvenio(false);
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

  // --- Render ---
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
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-overlay hover:bg-overlay-strong border border-border rounded-xl text-sm text-muted-foreground transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {t.common.edit}
                </button>
              )}
              {!settlement && (
                <button
                  onClick={() => setShowSettlement(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-overlay hover:bg-overlay-strong border border-border rounded-xl text-sm text-muted-foreground transition-colors cursor-pointer"
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
        <PersonalDataCard
          employee={employee}
          editMode={editMode}
          editForm={editForm}
          saving={saving}
          localeId={localeId}
          t={t}
          activeSchedule={activeSchedule}
          hasActiveContract={!!activeContract}
          onSaveEmployee={onSaveEmployee}
          onCancelEdit={() => setEditMode(false)}
        />

        <ContractSection
          contracts={contracts}
          isLoading={isLoading}
          localeId={localeId}
          t={t}
          canEdit={canEdit}
          canViewSalary={canViewSalary}
          showNewContract={showNewContract}
          setShowNewContract={setShowNewContract}
          contractForm={contractForm}
          onCreateContract={onCreateContract}
          useCustomConcepts={useCustomConcepts}
          setUseCustomConcepts={setUseCustomConcepts}
          selectedConceptIds={selectedConceptIds}
          setSelectedConceptIds={setSelectedConceptIds}
          companyConcepts={companyConcepts}
          editContract={editContract}
          setEditContract={setEditContract}
          editContractForm={editContractForm}
          onUpdateContract={onUpdateContract}
          editConceptIds={editConceptIds}
          setEditConceptIds={setEditConceptIds}
          editConceptsLoaded={editConceptsLoaded}
          expandedContract={expandedContract}
          setExpandedContract={setExpandedContract}
          contractConcepts={contractConcepts}
          loadingConcepts={loadingConcepts}
          onLoadContractConcepts={loadContractConceptsHandler}
          onAssignConcept={handleAssignConcept}
          onRemoveConcept={handleRemoveConcept}
          saving={saving}
        />
      </div>

      <ConvenioSection
        employee={employee}
        convenios={convenios}
        selectedConvenioId={selectedConvenioId}
        setSelectedConvenioId={setSelectedConvenioId}
        selectedCategoryId={selectedCategoryId}
        setSelectedCategoryId={setSelectedCategoryId}
        editingConvenio={editingConvenio}
        setEditingConvenio={setEditingConvenio}
        savingConvenio={savingConvenio}
        onSaveConvenio={onSaveConvenio}
        onClearConvenio={onClearConvenio}
        t={t}
      />

      {settlement && (
        <SettlementDetail
          settlement={settlement}
          canViewSalary={canViewSalary}
          localeId={localeId}
          t={t}
        />
      )}

      <SettlementModal
        open={showSettlement}
        onOpenChange={setShowSettlement}
        settlementReason={settlementReason}
        setSettlementReason={setSettlementReason}
        settlementDate={settlementDate}
        setSettlementDate={setSettlementDate}
        generatingSettlement={generatingSettlement}
        onGenerate={handleGenerateSettlement}
        t={t}
      />

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
