'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCategorySchema, type CreateCategoryInput } from '@/lib/validators/convenio';
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
import type { ConvenioCategory } from '@/lib/types/convenio';

const INPUT_CLASS =
  'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 focus:border-[#2563EB]/50 focus:ring-0';

interface CategoryFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateCategoryInput) => Promise<void>;
  editItem: ConvenioCategory | null;
  isSaving: boolean;
}

export function CategoryFormSheet({
  open,
  onOpenChange,
  onSubmit,
  editItem,
  isSaving,
}: CategoryFormSheetProps) {
  const t = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: { code: '', name: '', baseSalary: 0, hourlyRate: 0, sortOrder: 0 },
  });

  useEffect(() => {
    if (!open) return;
    if (editItem) {
      reset({
        code: editItem.code,
        name: editItem.name,
        baseSalary: Number(editItem.baseSalary),
        hourlyRate: Number(editItem.hourlyRate),
        sortOrder: editItem.sortOrder,
      });
    } else {
      reset({ code: '', name: '', baseSalary: 0, hourlyRate: 0, sortOrder: 0 });
    }
  }, [open, editItem, reset]);

  async function handleFormSubmit(data: CreateCategoryInput) {
    await onSubmit(data);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="bg-[#060B16] border-l border-white/[0.08] text-white overflow-y-auto w-[420px] max-w-[100vw]"
      >
        <SheetHeader className="pb-4 border-b border-white/[0.06]">
          <SheetTitle className="text-white">
            {editItem ? t.convenios.editCategory : t.convenios.addCategory}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4 p-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t.convenios.code} name="catCode" error={errors.code?.message} required>
              <Input
                {...register('code')}
                maxLength={20}
                placeholder="CAT-01"
                className={`${INPUT_CLASS} font-mono uppercase`}
              />
            </FormField>
            <FormField label={t.convenios.name} name="catName" error={errors.name?.message} required>
              <Input
                {...register('name')}
                maxLength={100}
                placeholder="Categoría A"
                className={INPUT_CLASS}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label={t.convenios.baseSalary}
              name="baseSalary"
              error={errors.baseSalary?.message}
              required
            >
              <Input
                type="number"
                step="0.01"
                min="0.01"
                {...register('baseSalary', { valueAsNumber: true })}
                placeholder="0.00"
                className={`${INPUT_CLASS} font-mono`}
              />
            </FormField>
            <FormField
              label={t.convenios.hourlyRate}
              name="hourlyRate"
              error={errors.hourlyRate?.message}
              required
            >
              <Input
                type="number"
                step="0.01"
                min="0.01"
                {...register('hourlyRate', { valueAsNumber: true })}
                placeholder="0.00"
                className={`${INPUT_CLASS} font-mono`}
              />
            </FormField>
          </div>

          <FormField
            label={t.convenios.sortOrder}
            name="sortOrder"
            error={errors.sortOrder?.message}
          >
            <Input
              type="number"
              min={0}
              {...register('sortOrder', { valueAsNumber: true })}
              className={`${INPUT_CLASS} font-mono`}
            />
          </FormField>

          <SheetFooter className="px-0 mt-2 flex-row gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors disabled:opacity-50"
            >
              {isSaving ? t.common.saving : t.common.save}
            </button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
