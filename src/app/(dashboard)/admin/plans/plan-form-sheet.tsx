'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPlanSchema, type CreatePlanInput } from '@/lib/validators/admin';
import { createPlan, updatePlan } from '@/lib/api/admin';
import { FormField } from '@/components/shared/form-field';
import { Input } from '@/components/ui/input';
import { toast } from '@/lib/utils/toast';
import { cn } from '@/lib/utils/cn';
import { useTranslation } from '@/lib/i18n';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import type { SubscriptionPlan } from '@/lib/types/admin';

const INPUT_CLASS =
  'bg-overlay border-border text-foreground placeholder:text-muted-foreground focus:border-brand/50 focus:ring-0';

interface PlanFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem: SubscriptionPlan | null;
  onSuccess: () => void;
}

export function PlanFormSheet({
  open,
  onOpenChange,
  editItem,
  onSuccess,
}: PlanFormSheetProps) {
  const t = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreatePlanInput & { isActive?: boolean }>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: {
      code: '',
      name: '',
      monthlyPrice: 0,
      annualPrice: 0,
      maxEmployees: 1,
      trialDays: 0,
      gracePeriodDays: 0,
      isCustom: false,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (editItem) {
      reset({
        code: editItem.code,
        name: editItem.name,
        monthlyPrice: Number(editItem.monthlyPrice),
        annualPrice: Number(editItem.annualPrice),
        maxEmployees: editItem.maxEmployees,
        trialDays: editItem.trialDays,
        gracePeriodDays: editItem.gracePeriodDays,
        isCustom: editItem.isCustom,
      });
    } else {
      reset({
        code: '',
        name: '',
        monthlyPrice: 0,
        annualPrice: 0,
        maxEmployees: 1,
        trialDays: 0,
        gracePeriodDays: 0,
        isCustom: false,
      });
    }
  }, [open, editItem, reset]);

  async function onSubmit(data: CreatePlanInput & { isActive?: boolean }) {
    try {
      if (editItem) {
        const { isActive, ...rest } = data;
        await updatePlan(editItem.id, { ...rest, isActive });
        toast.success(t.admin.planUpdated);
      } else {
        await createPlan(data);
        toast.success(t.admin.planCreated);
      }
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error(t.admin.saveError);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="bg-background border-l border-border text-foreground overflow-y-auto w-[480px] max-w-[100vw]"
      >
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="text-foreground">
            {editItem ? t.admin.editPlan : t.admin.newPlan}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 p-4">
          {/* Code + Name */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t.admin.planCode} name="code" error={errors.code?.message} required>
              <Input
                {...register('code')}
                maxLength={20}
                placeholder="FREE"
                className={cn(INPUT_CLASS, 'font-mono uppercase')}
              />
            </FormField>
            <FormField label={t.admin.planName} name="name" error={errors.name?.message} required>
              <Input
                {...register('name')}
                maxLength={100}
                placeholder="Plan Gratuito"
                className={INPUT_CLASS}
              />
            </FormField>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t.admin.monthlyPrice} name="monthlyPrice" error={errors.monthlyPrice?.message} required>
              <Input
                {...register('monthlyPrice', { valueAsNumber: true })}
                type="number"
                min={0}
                step="0.01"
                className={cn(INPUT_CLASS, 'font-mono')}
              />
            </FormField>
            <FormField label={t.admin.annualPrice} name="annualPrice" error={errors.annualPrice?.message} required>
              <Input
                {...register('annualPrice', { valueAsNumber: true })}
                type="number"
                min={0}
                step="0.01"
                className={cn(INPUT_CLASS, 'font-mono')}
              />
            </FormField>
          </div>

          {/* Max employees */}
          <FormField label={t.admin.maxEmployees} name="maxEmployees" error={errors.maxEmployees?.message} required>
            <Input
              {...register('maxEmployees', { valueAsNumber: true })}
              type="number"
              min={1}
              className={cn(INPUT_CLASS, 'font-mono')}
            />
          </FormField>

          {/* Trial + Grace period */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t.admin.trialDays} name="trialDays" error={errors.trialDays?.message}>
              <Input
                {...register('trialDays', { valueAsNumber: true })}
                type="number"
                min={0}
                className={cn(INPUT_CLASS, 'font-mono')}
              />
            </FormField>
            <FormField label={t.admin.gracePeriodDays} name="gracePeriodDays" error={errors.gracePeriodDays?.message}>
              <Input
                {...register('gracePeriodDays', { valueAsNumber: true })}
                type="number"
                min={0}
                className={cn(INPUT_CLASS, 'font-mono')}
              />
            </FormField>
          </div>

          {/* isActive toggle (only in edit mode) */}
          {editItem && (
            <Controller
              control={control}
              name="isActive"
              defaultValue={editItem.isActive}
              render={({ field }) => (
                <div className="flex items-center justify-between rounded-lg bg-overlay-subtle border border-border p-3">
                  <span className="text-sm text-muted-foreground">{t.admin.isActive}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={field.value ?? true}
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                      (field.value ?? true)
                        ? 'bg-brand'
                        : 'bg-overlay-strong'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                        (field.value ?? true) ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>
              )}
            />
          )}

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
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-brand hover:bg-brand-hover text-white transition-colors disabled:opacity-50"
            >
              {isSubmitting ? t.common.saving : t.common.save}
            </button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
