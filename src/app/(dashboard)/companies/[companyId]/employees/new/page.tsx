'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/utils/toast';
import { Loader2 } from 'lucide-react';
import { createEmployee } from '@/lib/api/employees';
import { createEmployeeSchema, type CreateEmployeeInput } from '@/lib/validators/employee';
import { ROUTES } from '@/lib/constants/routes';
import { PageHeader } from '@/components/shared/page-header';
import { FormField } from '@/components/shared/form-field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';

const INPUT_CLASS = 'bg-overlay border-border text-foreground placeholder:text-muted-foreground focus:border-brand/50 focus:ring-0';

const DOC_TYPE_KEYS = ['CI', 'RUC', 'PASSPORT', 'OTHER'] as const;

export default function NewEmployeePage() {
  const { companyId } = useParams<{ companyId: string }>();
  const router         = useRouter();
  const [loading, setLoading] = useState(false);
  const t = useTranslation();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateEmployeeInput>({
    resolver: zodResolver(createEmployeeSchema(t.validators)),
    defaultValues: { documentType: 'CI' },
  });

  async function onSubmit(data: CreateEmployeeInput) {
    setLoading(true);
    try {
      const payload = {
        documentType:   data.documentType,
        documentNumber: data.documentNumber,
        firstName:      data.firstName,
        lastName:       data.lastName,
        hireDate:       data.hireDate,
        email:          data.email    || undefined,
        phone:          data.phone    || undefined,
        birthDate:      data.birthDate || undefined,
      };
      const employee = await createEmployee(companyId, payload);
      toast.success(t.employees.new.success);
      router.push(ROUTES.employee(companyId, employee.id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.employees.new.error;
      if (msg.toLowerCase().includes('409') || msg.toLowerCase().includes('ya existe')) {
        toast.error(t.employees.new.duplicateDoc);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  const docTypeLabels = t.employees.docTypes as Record<string, string>;

  return (
    <>
      <PageHeader
        title={t.employees.new.title}
        description={t.employees.new.description}
        backHref={ROUTES.employees(companyId)}
      />

      <div className="max-w-2xl">
        <div className="bg-card border border-border rounded-xl p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

            <div className="flex gap-3">
              <FormField
                label={t.employees.new.docType}
                name="documentType"
                error={errors.documentType?.message}
                required
                className="w-44 shrink-0"
              >
                <Select
                  defaultValue="CI"
                  onValueChange={(v) => setValue('documentType', v, { shouldValidate: true })}
                >
                  <SelectTrigger className={INPUT_CLASS}>
                    <SelectValue placeholder={t.common.type} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    {DOC_TYPE_KEYS.map((key) => (
                      <SelectItem
                        key={key}
                        value={key}
                        className="focus:bg-overlay focus:text-foreground"
                      >
                        {docTypeLabels[key] ?? key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField
                label={t.employees.new.docNumber}
                name="documentNumber"
                error={errors.documentNumber?.message}
                required
                className="flex-1"
              >
                <Input
                  {...register('documentNumber')}
                  placeholder={t.employees.new.docPlaceholder}
                  maxLength={20}
                  className={INPUT_CLASS}
                />
              </FormField>
            </div>

            <div className="flex gap-3">
              <FormField label={t.employees.new.firstName} name="firstName" error={errors.firstName?.message} required className="flex-1">
                <Input
                  {...register('firstName')}
                  placeholder={t.employees.new.firstNamePlaceholder}
                  maxLength={100}
                  className={INPUT_CLASS}
                />
              </FormField>
              <FormField label={t.employees.new.lastName} name="lastName" error={errors.lastName?.message} required className="flex-1">
                <Input
                  {...register('lastName')}
                  placeholder={t.employees.new.lastNamePlaceholder}
                  maxLength={100}
                  className={INPUT_CLASS}
                />
              </FormField>
            </div>

            <FormField
              label={t.employees.new.hireDate}
              name="hireDate"
              error={errors.hireDate?.message}
              required
            >
              <Input
                {...register('hireDate')}
                type="date"
                className={`${INPUT_CLASS} [color-scheme:dark]`}
              />
            </FormField>

            <div className="border-t border-border pt-4 flex flex-col gap-5">
              <p className="text-xs text-muted-foreground -mb-2">{t.employees.new.optionalData}</p>

              <FormField label={t.employees.new.email} name="email" error={errors.email?.message}>
                <Input
                  {...register('email')}
                  type="email"
                  placeholder={t.employees.new.emailPlaceholder}
                  className={INPUT_CLASS}
                />
              </FormField>

              <FormField label={t.employees.new.phone} name="phone" error={errors.phone?.message}>
                <Input
                  {...register('phone')}
                  type="tel"
                  maxLength={20}
                  placeholder={t.employees.new.phonePlaceholder}
                  className={INPUT_CLASS}
                />
              </FormField>

              <FormField
                label={t.employees.new.birthDate}
                name="birthDate"
                error={errors.birthDate?.message}
              >
                <Input
                  {...register('birthDate')}
                  type="date"
                  className={`${INPUT_CLASS} [color-scheme:dark]`}
                />
              </FormField>
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full bg-brand hover:bg-brand-hover disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-medium transition-colors mt-1"
            >
              {loading ? (<span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 motion-safe:animate-spin" />{t.employees.new.submitting}</span>) : t.employees.new.submit}
            </button>
          </form>
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          {t.employees.new.contractNote}
        </p>
      </div>
    </>
  );
}
