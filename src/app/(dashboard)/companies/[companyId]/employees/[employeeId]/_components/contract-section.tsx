'use client';

import { UseFormReturn } from 'react-hook-form';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Calendar,
  FilePlus,
  Pencil,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  BookOpen,
} from 'lucide-react';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { RoleGate } from '@/components/shared/role-gate';
import type { Contract } from '@/lib/types/employee';
import type { PayrollConcept } from '@/lib/types/payroll';
import type { ContractConcept } from '@/lib/api/contracts';
import type { CreateContractInput } from '@/lib/validators/employee';
import type { Translations } from '@/lib/i18n/es';
import { formatDate } from './shared';
import { NewContractForm, EditContractForm } from './contract-forms';

interface ContractSectionProps {
  contracts: Contract[];
  isLoading: boolean;
  localeId: string;
  t: Translations;
  canEdit: () => boolean;
  canViewSalary: () => boolean;
  showNewContract: boolean;
  setShowNewContract: (v: boolean) => void;
  contractForm: UseFormReturn<CreateContractInput>;
  onCreateContract: (data: CreateContractInput) => void;
  useCustomConcepts: boolean;
  setUseCustomConcepts: (v: boolean) => void;
  selectedConceptIds: Set<string>;
  setSelectedConceptIds: (v: Set<string>) => void;
  companyConcepts: PayrollConcept[];
  editContract: Contract | null;
  setEditContract: (v: Contract | null) => void;
  editContractForm: UseFormReturn<CreateContractInput>;
  onUpdateContract: (data: CreateContractInput) => void;
  editConceptIds: Set<string>;
  setEditConceptIds: (v: Set<string>) => void;
  editConceptsLoaded: boolean;
  expandedContract: string | null;
  setExpandedContract: (v: string | null) => void;
  contractConcepts: Record<string, ContractConcept[]>;
  loadingConcepts: string | null;
  onLoadContractConcepts: (contractId: string) => void;
  onAssignConcept: (contractId: string, conceptId: string) => void;
  onRemoveConcept: (contractId: string, conceptId: string) => void;
  saving: boolean;
}

export function ContractSection({
  contracts,
  isLoading,
  localeId,
  t,
  canEdit,
  canViewSalary,
  showNewContract,
  setShowNewContract,
  contractForm,
  onCreateContract,
  useCustomConcepts,
  setUseCustomConcepts,
  selectedConceptIds,
  setSelectedConceptIds,
  companyConcepts,
  editContract,
  setEditContract,
  editContractForm,
  onUpdateContract,
  editConceptIds,
  setEditConceptIds,
  editConceptsLoaded,
  expandedContract,
  setExpandedContract,
  contractConcepts,
  loadingConcepts,
  onLoadContractConcepts,
  onAssignConcept,
  onRemoveConcept,
  saving,
}: ContractSectionProps) {
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

  return (
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

      {showNewContract && (
        <NewContractForm
          contractForm={contractForm}
          onCreateContract={onCreateContract}
          onCancel={() => { setShowNewContract(false); contractForm.reset({ salaryType: 'MONTHLY' }); setUseCustomConcepts(false); setSelectedConceptIds(new Set()); }}
          saving={saving}
          t={t}
          companyConcepts={companyConcepts}
          useCustomConcepts={useCustomConcepts}
          setUseCustomConcepts={setUseCustomConcepts}
          selectedConceptIds={selectedConceptIds}
          setSelectedConceptIds={setSelectedConceptIds}
        />
      )}

      {editContract && (
        <EditContractForm
          editContractForm={editContractForm}
          onUpdateContract={onUpdateContract}
          onCancel={() => setEditContract(null)}
          saving={saving}
          t={t}
          companyConcepts={companyConcepts}
          editConceptIds={editConceptIds}
          setEditConceptIds={setEditConceptIds}
          editConceptsLoaded={editConceptsLoaded}
        />
      )}

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

      {expandedContract && (() => {
        const ct = contracts.find((c) => c.id === expandedContract);
        if (!ct) return null;
        return (
          <ExpandedContractDetail
            ct={ct}
            t={t}
            canEdit={canEdit}
            companyConcepts={companyConcepts}
            contractConcepts={contractConcepts}
            loadingConcepts={loadingConcepts}
            onLoadContractConcepts={onLoadContractConcepts}
            onAssignConcept={onAssignConcept}
            onRemoveConcept={onRemoveConcept}
          />
        );
      })()}
    </div>
  );
}

function ExpandedContractDetail({
  ct,
  t,
  canEdit,
  companyConcepts,
  contractConcepts,
  loadingConcepts,
  onLoadContractConcepts,
  onAssignConcept,
  onRemoveConcept,
}: {
  ct: Contract;
  t: Translations;
  canEdit: () => boolean;
  companyConcepts: PayrollConcept[];
  contractConcepts: Record<string, ContractConcept[]>;
  loadingConcepts: string | null;
  onLoadContractConcepts: (contractId: string) => void;
  onAssignConcept: (contractId: string, conceptId: string) => void;
  onRemoveConcept: (contractId: string, conceptId: string) => void;
}) {
  const ctConcepts = contractConcepts[ct.id];
  const hasSchedule = ct.weeklySchedule && ct.weeklySchedule.length > 0;

  if (ctConcepts === undefined && loadingConcepts !== ct.id) {
    onLoadContractConcepts(ct.id);
  }

  const assignedIds = new Set((ctConcepts ?? []).map((c) => c.id));
  const unassigned = companyConcepts.filter((c) => !assignedIds.has(c.id));

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-4">
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
                    onClick={() => onRemoveConcept(ct.id, concept.id)}
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

        {canEdit() && unassigned.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/[0.04]">
            <p className="text-[11px] text-slate-600 mb-2">{t.employees.detail.addConcept}</p>
            <div className="flex flex-wrap gap-1.5">
              {unassigned.map((concept) => (
                <button
                  key={concept.id}
                  onClick={() => onAssignConcept(ct.id, concept.id)}
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
}
