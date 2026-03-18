'use client';

import { useEffect, forwardRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { createConvenioSchema, type CreateConvenioInput } from '@/lib/validators/convenio';
import { FormField } from '@/components/shared/form-field';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import type { Convenio } from '@/lib/types/convenio';

const INPUT_CLASS =
  'bg-overlay border-border text-foreground placeholder:text-muted-foreground focus:border-brand/50 focus:ring-0';

interface ConvenioFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateConvenioInput) => Promise<void>;
  editItem: Convenio | null;
  isSaving: boolean;
}

export function ConvenioFormSheet({
  open,
  onOpenChange,
  onSubmit,
  editItem,
  isSaving,
}: ConvenioFormSheetProps) {
  const t = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateConvenioInput>({
    resolver: zodResolver(createConvenioSchema),
    defaultValues: { code: '', name: '' },
  });

  const seniorityFields = useFieldArray({ control, name: 'seniorityBonusRules' });
  const vacationFields = useFieldArray({ control, name: 'vacationRules' });
  const sickLeaveFields = useFieldArray({ control, name: 'sickLeaveRules' });

  useEffect(() => {
    if (!open) return;
    if (editItem) {
      reset({
        code: editItem.code,
        name: editItem.name,
        seniorityBonusRules: editItem.seniorityBonusRules ?? [],
        vacationRules: editItem.vacationRules ?? [],
        sickLeaveRules: editItem.sickLeaveRules ?? [],
      });
    } else {
      reset({ code: '', name: '', seniorityBonusRules: [], vacationRules: [], sickLeaveRules: [] });
    }
  }, [open, editItem, reset]);

  async function handleFormSubmit(data: CreateConvenioInput) {
    await onSubmit(data);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="bg-sidebar border-l border-border text-foreground overflow-y-auto w-[520px] max-w-[100vw]"
      >
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="text-foreground">
            {editItem ? t.convenios.editTitle : t.convenios.createTitle}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5 p-4">
          {/* Code + Name */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t.convenios.code} name="code" error={errors.code?.message} required>
              <Input
                {...register('code')}
                maxLength={20}
                placeholder="CCT-000"
                className={`${INPUT_CLASS} font-mono uppercase`}
              />
            </FormField>
            <FormField label={t.convenios.name} name="name" error={errors.name?.message} required>
              <Input
                {...register('name')}
                maxLength={100}
                placeholder="Comercio"
                className={INPUT_CLASS}
              />
            </FormField>
          </div>

          {/* Seniority Bonus Rules */}
          <BracketSection
            title={t.convenios.seniorityBonusRules}
            fields={seniorityFields.fields}
            onAdd={() => seniorityFields.append({ minYears: 0, maxYears: 5, percentPerYear: 1 })}
            t={t}
          >
            {seniorityFields.fields.map((field, index) => (
              <BracketRow key={field.id} onRemove={() => seniorityFields.remove(index)} t={t}>
                <MiniInput
                  label={t.convenios.minYears}
                  {...register(`seniorityBonusRules.${index}.minYears`, { valueAsNumber: true })}
                  type="number"
                  min={0}
                />
                <MiniInput
                  label={t.convenios.maxYears}
                  {...register(`seniorityBonusRules.${index}.maxYears`, { valueAsNumber: true })}
                  type="number"
                  min={1}
                />
                <MiniInput
                  label={t.convenios.percentPerYear}
                  {...register(`seniorityBonusRules.${index}.percentPerYear`, { valueAsNumber: true })}
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                />
              </BracketRow>
            ))}
          </BracketSection>

          {/* Vacation Rules */}
          <BracketSection
            title={t.convenios.vacationRules}
            fields={vacationFields.fields}
            onAdd={() => vacationFields.append({ minYears: 0, maxYears: 5, days: 14 })}
            t={t}
          >
            {vacationFields.fields.map((field, index) => (
              <BracketRow key={field.id} onRemove={() => vacationFields.remove(index)} t={t}>
                <MiniInput
                  label={t.convenios.minYears}
                  {...register(`vacationRules.${index}.minYears`, { valueAsNumber: true })}
                  type="number"
                  min={0}
                />
                <MiniInput
                  label={t.convenios.maxYears}
                  {...register(`vacationRules.${index}.maxYears`, { valueAsNumber: true })}
                  type="number"
                  min={1}
                />
                <MiniInput
                  label={t.convenios.days}
                  {...register(`vacationRules.${index}.days`, { valueAsNumber: true })}
                  type="number"
                  min={0}
                />
              </BracketRow>
            ))}
          </BracketSection>

          {/* Sick Leave Rules */}
          <BracketSection
            title={t.convenios.sickLeaveRules}
            fields={sickLeaveFields.fields}
            onAdd={() => sickLeaveFields.append({ minYears: 0, maxYears: 5, days: 3 })}
            t={t}
          >
            {sickLeaveFields.fields.map((field, index) => (
              <BracketRow key={field.id} onRemove={() => sickLeaveFields.remove(index)} t={t}>
                <MiniInput
                  label={t.convenios.minYears}
                  {...register(`sickLeaveRules.${index}.minYears`, { valueAsNumber: true })}
                  type="number"
                  min={0}
                />
                <MiniInput
                  label={t.convenios.maxYears}
                  {...register(`sickLeaveRules.${index}.maxYears`, { valueAsNumber: true })}
                  type="number"
                  min={1}
                />
                <MiniInput
                  label={t.convenios.days}
                  {...register(`sickLeaveRules.${index}.days`, { valueAsNumber: true })}
                  type="number"
                  min={0}
                />
              </BracketRow>
            ))}
          </BracketSection>

          <SheetFooter className="px-0 mt-2 flex-row gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
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
  );
}

// ─── Bracket section wrapper ──────────────────────────────────────────────────

interface BracketSectionProps {
  title: string;
  fields: { id: string }[];
  onAdd: () => void;
  t: ReturnType<typeof useTranslation>;
  children: React.ReactNode;
}

function BracketSection({ title, fields, onAdd, t, children }: BracketSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 text-xs text-brand hover:text-brand-text transition-colors"
        >
          <Plus className="w-3 h-3" />
          {t.convenios.addRule}
        </button>
      </div>
      {fields.length === 0 && (
        <p className="text-xs text-muted-foreground italic">{t.convenios.noCategories}</p>
      )}
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// ─── Bracket row ──────────────────────────────────────────────────────────────

interface BracketRowProps {
  onRemove: () => void;
  t: ReturnType<typeof useTranslation>;
  children: React.ReactNode;
}

function BracketRow({ onRemove, t, children }: BracketRowProps) {
  return (
    <div className="flex items-end gap-2 rounded-lg bg-overlay-subtle border border-border p-2.5">
      <div className="flex-1 grid grid-cols-3 gap-2">{children}</div>
      <button
        type="button"
        onClick={onRemove}
        title={t.convenios.removeRule}
        className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/[0.06] transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Mini input (compact input for bracket rules) ─────────────────────────────

interface MiniInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const MiniInput = forwardRef<HTMLInputElement, MiniInputProps>(
  function MiniInput({ label, ...props }, ref) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
        <input
          ref={ref}
          {...props}
          className="h-8 rounded-md bg-overlay border border-border text-foreground text-xs font-mono px-2 focus:border-brand/50 focus:outline-none"
        />
      </div>
    );
  }
);
