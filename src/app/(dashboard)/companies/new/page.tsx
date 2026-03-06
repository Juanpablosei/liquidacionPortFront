'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/utils/toast';
import { Loader2 } from 'lucide-react';
import { createCompany } from '@/lib/api/companies';
import { createCompanySchema, type CreateCompanyInput } from '@/lib/validators/company';
import { ROUTES } from '@/lib/constants/routes';
import { PageHeader } from '@/components/shared/page-header';
import { FormField } from '@/components/shared/form-field';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

export default function NewCompanyPage() {
  const router     = useRouter();
  const [loading, setLoading] = useState(false);
  const t = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCompanyInput>({
    resolver: zodResolver(createCompanySchema(t.validators)),
  });

  async function onSubmit(data: CreateCompanyInput) {
    setLoading(true);
    try {
      const payload = {
        name:    data.name,
        taxId:   data.taxId   || undefined,
        address: data.address || undefined,
        phone:   data.phone   || undefined,
      };
      const company = await createCompany(payload);
      toast.success(t.companies.new.submit);
      router.push(ROUTES.company(company.id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.companies.new.submit;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title={t.companies.new.title}
        description={t.companies.new.description}
        backHref={ROUTES.companies}
      />

      <div className="max-w-2xl">
        <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

            <FormField label={t.companies.new.companyName} name="name" error={errors.name?.message} required>
              <Input
                {...register('name')}
                maxLength={100}
                placeholder={t.companies.new.namePlaceholder}
                className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 focus:border-[#2563EB]/50 focus:ring-0"
              />
            </FormField>

            <FormField
              label={t.companies.new.cuit}
              name="taxId"
              error={errors.taxId?.message}
              hint={t.companies.new.cuitHint}
            >
              <Input
                {...register('taxId')}
                maxLength={13}
                inputMode="numeric"
                placeholder={t.companies.new.cuitPlaceholder}
                className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 focus:border-[#2563EB]/50 focus:ring-0"
              />
            </FormField>

            <FormField label={t.companies.new.address} name="address" error={errors.address?.message}>
              <Input
                {...register('address')}
                maxLength={200}
                placeholder={t.companies.new.addressPlaceholder}
                className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 focus:border-[#2563EB]/50 focus:ring-0"
              />
            </FormField>

            <FormField label={t.companies.new.phone} name="phone" error={errors.phone?.message}>
              <Input
                {...register('phone')}
                type="tel"
                maxLength={20}
                placeholder={t.companies.new.phonePlaceholder}
                className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 focus:border-[#2563EB]/50 focus:ring-0"
              />
            </FormField>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                {loading ? (<span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 motion-safe:animate-spin" />{t.companies.new.submitting}</span>) : t.companies.new.submit}
              </button>
            </div>
          </form>
        </div>

        <p className="text-xs text-slate-600 mt-4 text-center">
          {t.companies.new.ownerNote}
        </p>
      </div>
    </>
  );
}
