'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/utils/toast';
import { Loader2, Check, Building2, CreditCard, ArrowRight, ArrowLeft } from 'lucide-react';
import { createCompany, getPublicPlans } from '@/lib/api/companies';
import { createCompanySchema, type CreateCompanyInput } from '@/lib/validators/company';
import { ROUTES } from '@/lib/constants/routes';
import { PageHeader } from '@/components/shared/page-header';
import { FormField } from '@/components/shared/form-field';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';
import type { SubscriptionPlan } from '@/lib/types/admin';

const INPUT_CLASS = 'bg-overlay border-border text-foreground placeholder:text-muted-foreground focus:border-brand/50 focus:ring-0';

export default function NewCompanyPage() {
  const router = useRouter();
  const t = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [plansLoading, setPlansLoading] = useState(true);

  const {
    register,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<CreateCompanyInput>({
    resolver: zodResolver(createCompanySchema(t.validators)),
  });

  useEffect(() => {
    getPublicPlans()
      .then((p) => { setPlans(p); setPlansLoading(false); })
      .catch(() => setPlansLoading(false));
  }, []);

  async function handleNext() {
    const valid = await trigger(['name', 'taxId', 'address', 'phone']);
    if (valid) setStep(2);
  }

  async function onSubmit() {
    setLoading(true);
    try {
      const data = getValues();
      const payload = {
        name: data.name,
        taxId: data.taxId || undefined,
        address: data.address || undefined,
        phone: data.phone || undefined,
        planCode: selectedPlan || undefined,
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

  function formatPrice(price: string): string {
    const n = parseFloat(price);
    if (n === 0) return t.companies.new.planFree;
    return `$${n.toLocaleString()}`;
  }

  return (
    <>
      <PageHeader
        title={t.companies.new.title}
        description={t.companies.new.description}
        backHref={ROUTES.companies}
      />

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-6 max-w-2xl">
        <div className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
          step === 1 ? 'bg-brand/15 text-brand-text' : 'text-muted-foreground',
        )}>
          <Building2 className="w-4 h-4" />
          {t.companies.new.stepCompanyData}
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <div className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
          step === 2 ? 'bg-brand/15 text-brand-text' : 'text-muted-foreground',
        )}>
          <CreditCard className="w-4 h-4" />
          {t.companies.new.stepSelectPlan}
        </div>
      </div>

      {/* Step 1: Company Data */}
      {step === 1 && (
        <div className="max-w-2xl">
          <div className="bg-card border border-border rounded-xl p-6">
            <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="flex flex-col gap-5">
              <FormField label={t.companies.new.companyName} name="name" error={errors.name?.message} required>
                <Input {...register('name')} maxLength={100} placeholder={t.companies.new.namePlaceholder} className={INPUT_CLASS} />
              </FormField>

              <FormField label={t.companies.new.cuit} name="taxId" error={errors.taxId?.message} hint={t.companies.new.cuitHint}>
                <Input {...register('taxId')} maxLength={13} inputMode="numeric" placeholder={t.companies.new.cuitPlaceholder} className={INPUT_CLASS} />
              </FormField>

              <FormField label={t.companies.new.address} name="address" error={errors.address?.message}>
                <Input {...register('address')} maxLength={200} placeholder={t.companies.new.addressPlaceholder} className={INPUT_CLASS} />
              </FormField>

              <FormField label={t.companies.new.phone} name="phone" error={errors.phone?.message}>
                <Input {...register('phone')} type="tel" maxLength={20} placeholder={t.companies.new.phonePlaceholder} className={INPUT_CLASS} />
              </FormField>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  {t.companies.new.next}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Step 2: Plan Selection */}
      {step === 2 && (
        <div className="max-w-4xl">
          <p className="text-sm text-muted-foreground mb-4">{t.companies.new.selectPlanDesc}</p>

          {plansLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.code;
                const isFree = parseFloat(plan.monthlyPrice) === 0;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.code)}
                    className={cn(
                      'flex flex-col items-start p-5 rounded-xl border-2 text-left transition-all duration-150',
                      isSelected
                        ? 'border-brand bg-brand/[0.06]'
                        : 'border-border bg-card hover:border-brand/40',
                    )}
                  >
                    <div className="flex items-center justify-between w-full mb-3">
                      <span className="text-base font-semibold text-foreground">{plan.name}</span>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-xs font-medium text-brand-text bg-brand/15 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" />
                          {t.companies.new.planCurrent}
                        </span>
                      )}
                    </div>

                    <div className="mb-3">
                      <span className="text-2xl font-bold text-foreground">
                        {formatPrice(plan.monthlyPrice)}
                      </span>
                      {!isFree && (
                        <span className="text-sm text-muted-foreground">{t.companies.new.planMonthly}</span>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {plan.maxEmployees > 0
                        ? t.companies.new.planEmployees.replace('{max}', String(plan.maxEmployees))
                        : t.companies.new.planEmployeesUnlimited}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground bg-overlay-subtle hover:bg-overlay-strong border border-border transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.companies.new.back}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.companies.new.submitting}
                </span>
              ) : t.companies.new.submit}
            </button>
          </div>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            {t.companies.new.ownerNote}
          </p>
        </div>
      )}
    </>
  );
}
