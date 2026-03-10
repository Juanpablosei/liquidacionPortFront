'use client';

import { UseFormReturn } from 'react-hook-form';
import { BookOpen } from 'lucide-react';
import { FormField } from '@/components/shared/form-field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PayrollConcept } from '@/lib/types/payroll';
import type { CreateContractInput } from '@/lib/validators/employee';
import type { Translations } from '@/lib/i18n/es';
import { INPUT_CLASS } from './shared';

// --- Concept checkbox list ---

export function ConceptCheckboxList({
  concepts,
  checkedIds,
  onToggle,
  t,
}: {
  concepts: PayrollConcept[];
  checkedIds: Set<string>;
  onToggle: (id: string, checked: boolean) => void;
  t: Translations;
}) {
  return (
    <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
      {concepts.map((concept) => (
        <label
          key={concept.id}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] cursor-pointer transition-colors"
        >
          <input
            type="checkbox"
            checked={checkedIds.has(concept.id)}
            onChange={(e) => onToggle(concept.id, e.target.checked)}
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
  );
}

// --- New contract form ---

export function NewContractForm({
  contractForm,
  onCreateContract,
  onCancel,
  saving,
  t,
  companyConcepts,
  useCustomConcepts,
  setUseCustomConcepts,
  selectedConceptIds,
  setSelectedConceptIds,
}: {
  contractForm: UseFormReturn<CreateContractInput>;
  onCreateContract: (data: CreateContractInput) => void;
  onCancel: () => void;
  saving: boolean;
  t: Translations;
  companyConcepts: PayrollConcept[];
  useCustomConcepts: boolean;
  setUseCustomConcepts: (v: boolean) => void;
  selectedConceptIds: Set<string>;
  setSelectedConceptIds: (v: Set<string>) => void;
}) {
  return (
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
              <ConceptCheckboxList
                concepts={companyConcepts}
                checkedIds={selectedConceptIds}
                onToggle={(id, checked) => {
                  const next = new Set(selectedConceptIds);
                  if (checked) next.add(id);
                  else next.delete(id);
                  setSelectedConceptIds(next);
                }}
                t={t}
              />
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
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
  );
}

// --- Edit contract form ---

export function EditContractForm({
  editContractForm,
  onUpdateContract,
  onCancel,
  saving,
  t,
  companyConcepts,
  editConceptIds,
  setEditConceptIds,
  editConceptsLoaded,
}: {
  editContractForm: UseFormReturn<CreateContractInput>;
  onUpdateContract: (data: CreateContractInput) => void;
  onCancel: () => void;
  saving: boolean;
  t: Translations;
  companyConcepts: PayrollConcept[];
  editConceptIds: Set<string>;
  setEditConceptIds: (v: Set<string>) => void;
  editConceptsLoaded: boolean;
}) {
  return (
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

        {companyConcepts.length > 0 && (
          <div className="border-t border-white/[0.06] pt-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-medium text-slate-400">{t.employees.detail.assignedConcepts}</span>
            </div>
            {!editConceptsLoaded ? (
              <p className="text-xs text-slate-600 motion-safe:animate-pulse">{t.employees.detail.loadingConcepts}</p>
            ) : (
              <ConceptCheckboxList
                concepts={companyConcepts}
                checkedIds={editConceptIds}
                onToggle={(id, checked) => {
                  const next = new Set(editConceptIds);
                  if (checked) next.add(id);
                  else next.delete(id);
                  setEditConceptIds(next);
                }}
                t={t}
              />
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
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
  );
}
