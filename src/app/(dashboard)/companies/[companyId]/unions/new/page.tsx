'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/utils/toast';
import { createUnion } from '@/lib/api/unions';
import { createUnionSchema, type CreateUnionInput } from '@/lib/validators/union';
import { ROUTES } from '@/lib/constants/routes';
import { useTranslation } from '@/lib/i18n';
import { PageHeader } from '@/components/shared/page-header';
import { FormField } from '@/components/shared/form-field';
import { Input } from '@/components/ui/input';

const INPUT_CLASS = 'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 focus:border-[#2563EB]/50 focus:ring-0';

export default function NewUnionPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const router = useRouter();
  const t = useTranslation();

  const [isSaving, setIsSaving] = useState(false);

  const schema = useMemo(() => createUnionSchema(t.validators), [t.validators]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateUnionInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:        '',
      code:        '',
      duesType:    'PERCENTAGE',
      duesValue:   '',
      description: '',
    },
  });

  const watchedDuesType = watch('duesType');

  async function onSubmit(data: CreateUnionInput) {
    setIsSaving(true);
    try {
      await createUnion(companyId, {
        name:        data.name,
        code:        data.code,
        duesType:    data.duesType,
        duesValue:   parseFloat(data.duesValue),
        description: data.description || undefined,
      });
      toast.success(t.unions.created);
      router.push(ROUTES.unions(companyId));
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.unions.saveError);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title={t.unions.newUnion}
        description={t.unions.description}
        backHref={ROUTES.unions(companyId)}
      />

      <div className="max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Name */}
          <FormField label={t.unions.name} name="name" error={errors.name?.message} required>
            <Input
              {...register('name')}
              maxLength={100}
              placeholder={t.unions.name}
              className={INPUT_CLASS}
            />
          </FormField>

          {/* Code */}
          <FormField label={t.unions.code} name="code" error={errors.code?.message} required>
            <Input
              {...register('code')}
              maxLength={20}
              placeholder="SIND-001"
              className={`${INPUT_CLASS} font-mono uppercase`}
            />
          </FormField>

          {/* Dues Type */}
          <FormField label={t.unions.duesType} name="duesType" error={errors.duesType?.message} required>
            <div className="grid grid-cols-2 gap-2">
              {(['PERCENTAGE', 'FIXED_AMOUNT'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setValue('duesType', type)}
                  className={`py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                    watchedDuesType === type
                      ? 'bg-[#2563EB]/20 border-[#2563EB]/50 text-[#93BBFC]'
                      : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:border-white/[0.15]'
                  }`}
                >
                  {type === 'PERCENTAGE' ? t.unions.duesPercentage : t.unions.duesFixedAmount}
                </button>
              ))}
            </div>
          </FormField>

          {/* Dues Value */}
          <FormField label={t.unions.duesValue} name="duesValue" error={errors.duesValue?.message} required>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register('duesValue')}
              placeholder={watchedDuesType === 'PERCENTAGE' ? '3.00' : '5000.00'}
              className={`${INPUT_CLASS} font-mono`}
            />
          </FormField>

          {/* Description */}
          <FormField label={t.unions.descriptionLabel} name="description" error={errors.description?.message}>
            <textarea
              {...register('description')}
              maxLength={500}
              placeholder={t.unions.descriptionPlaceholder}
              className={`${INPUT_CLASS} min-h-[80px] resize-none w-full rounded-md border px-3 py-2 text-sm`}
            />
          </FormField>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push(ROUTES.unions(companyId))}
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
          </div>
        </form>
      </div>
    </>
  );
}
