'use client';

import { UseFormReturn } from 'react-hook-form';
import { Clock } from 'lucide-react';
import { FormField } from '@/components/shared/form-field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Employee, ContractScheduleEntry } from '@/lib/types/employee';
import type { UpdateEmployeeInput } from '@/lib/validators/employee';
import type { Translations } from '@/lib/i18n/es';
import { DataRow, formatDate, INPUT_CLASS, DOC_TYPE_KEYS } from './shared';

interface PersonalDataCardProps {
  employee: Employee;
  editMode: boolean;
  editForm: UseFormReturn<UpdateEmployeeInput>;
  saving: boolean;
  localeId: string;
  t: Translations;
  activeSchedule: ContractScheduleEntry[];
  hasActiveContract: boolean;
  onSaveEmployee: (data: UpdateEmployeeInput) => void;
  onCancelEdit: () => void;
}

export function PersonalDataCard({
  employee,
  editMode,
  editForm,
  saving,
  localeId,
  t,
  activeSchedule,
  hasActiveContract,
  onSaveEmployee,
  onCancelEdit,
}: PersonalDataCardProps) {
  const docTypeLabels = t.employees.docTypes as Record<string, string>;

  return (
    <div className="lg:col-span-1">
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">{t.employees.detail.personalData}</h2>

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
                  <SelectContent className="bg-card border-border text-foreground">
                    {DOC_TYPE_KEYS.map((key) => (
                      <SelectItem key={key} value={key} className="focus:bg-overlay focus:text-foreground">
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
                onClick={onCancelEdit}
                className="flex-1 py-2 rounded-xl text-sm text-muted-foreground bg-overlay-subtle hover:bg-overlay-strong border border-border transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2 rounded-xl text-sm text-white bg-brand hover:bg-brand-hover disabled:opacity-60 transition-colors"
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
      {hasActiveContract && activeSchedule.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">{t.employees.detail.weeklySchedule}</h2>
          </div>
          <div className="flex flex-col gap-2">
            {activeSchedule
              .sort((a, b) => a.weekday - b.weekday)
              .map((entry) => (
                <div key={entry.id} className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground w-8">
                    {t.employees.detail.weekdays[entry.weekday]}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {entry.startTime} – {entry.endTime}
                  </span>
                  {entry.breakMinutes > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {entry.breakMinutes}&apos; {t.employees.detail.breakMinutes}
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
