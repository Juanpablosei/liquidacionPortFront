'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import type { Convenio, SeniorityBonusRule, VacationRule, SickLeaveRule } from '@/lib/types/convenio';
import { SeniorityBonusEditor, DaysBracketEditor } from './bracket-rules-editor';

const INPUT_CLASS =
  'bg-overlay border-border text-foreground placeholder:text-muted-foreground focus:border-brand/50 focus:ring-0';

interface ConvenioSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateConvenioInput) => Promise<void>;
  editItem: Convenio | null;
  isSaving: boolean;
}

export function ConvenioSheet({ open, onOpenChange, onSubmit, editItem, isSaving }: ConvenioSheetProps) {
  const t = useTranslation();

  const [seniorityRules, setSeniorityRules] = useState<SeniorityBonusRule[]>([]);
  const [vacationRules, setVacationRules] = useState<VacationRule[]>([]);
  const [sickLeaveRules, setSickLeaveRules] = useState<SickLeaveRule[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateConvenioInput>({
    resolver: zodResolver(createConvenioSchema),
    defaultValues: { code: '', name: '' },
  });

  // Reset form + bracket state when the sheet opens via onAnimationStart
  function handleAnimationStart() {
    if (editItem) {
      reset({ code: editItem.code, name: editItem.name });
      setSeniorityRules(editItem.seniorityBonusRules ?? []);
      setVacationRules(editItem.vacationRules ?? []);
      setSickLeaveRules(editItem.sickLeaveRules ?? []);
    } else {
      reset({ code: '', name: '' });
      setSeniorityRules([]);
      setVacationRules([]);
      setSickLeaveRules([]);
    }
  }

  function handleFormSubmit(data: CreateConvenioInput) {
    return onSubmit({
      ...data,
      seniorityBonusRules: seniorityRules.length > 0 ? seniorityRules : undefined,
      vacationRules:       vacationRules.length > 0 ? vacationRules : undefined,
      sickLeaveRules:      sickLeaveRules.length > 0 ? sickLeaveRules : undefined,
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="bg-sidebar border-l border-border text-foreground overflow-y-auto w-[480px] max-w-[100vw]"
        onAnimationStart={handleAnimationStart}
      >
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="text-foreground">
            {editItem ? t.convenios.editTitle : t.convenios.createTitle}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4 p-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t.convenios.code} name="code" error={errors.code?.message} required>
              <Input
                {...register('code')}
                maxLength={20}
                placeholder="CCT-001"
                className={`${INPUT_CLASS} font-mono uppercase`}
              />
            </FormField>
            <FormField label={t.convenios.name} name="name" error={errors.name?.message} required>
              <Input
                {...register('name')}
                maxLength={200}
                placeholder="Comercio"
                className={INPUT_CLASS}
              />
            </FormField>
          </div>

          {/* Bracket rules editors */}
          <div className="border-t border-border pt-4 flex flex-col gap-5">
            <SeniorityBonusEditor value={seniorityRules} onChange={setSeniorityRules} />
            <DaysBracketEditor label={t.convenios.vacationRules} value={vacationRules} onChange={setVacationRules} />
            <DaysBracketEditor label={t.convenios.sickLeaveRules} value={sickLeaveRules} onChange={setSickLeaveRules} />
          </div>

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
