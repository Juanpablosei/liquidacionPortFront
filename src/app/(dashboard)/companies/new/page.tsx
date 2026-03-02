'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';
import { createCompany } from '@/lib/api/companies';
import { createCompanySchema, type CreateCompanyInput } from '@/lib/validators/company';
import { ROUTES } from '@/lib/constants/routes';
import { PageHeader } from '@/components/shared/page-header';
import { FormField } from '@/components/shared/form-field';
import { Input } from '@/components/ui/input';

export default function NewCompanyPage() {
  const router     = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCompanyInput>({
    resolver: zodResolver(createCompanySchema),
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
      toast.success('Empresa creada correctamente');
      router.push(ROUTES.company(company.id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear la empresa';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Nueva empresa"
        description="Completá los datos básicos. Podés editarlos después en configuración."
        backHref={ROUTES.companies}
      />

      <div className="max-w-lg">
        <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

            <FormField label="Nombre de la empresa" name="name" error={errors.name?.message} required>
              <Input
                {...register('name')}
                placeholder="Ej: Acme S.A."
                className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 focus:border-[#2563EB]/50 focus:ring-0"
              />
            </FormField>

            <FormField
              label="CUIT"
              name="taxId"
              error={errors.taxId?.message}
              hint="Número de identificación fiscal. Sin guiones."
            >
              <Input
                {...register('taxId')}
                placeholder="Ej: 30712345678"
                className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 focus:border-[#2563EB]/50 focus:ring-0"
              />
            </FormField>

            <FormField label="Dirección" name="address" error={errors.address?.message}>
              <Input
                {...register('address')}
                placeholder="Ej: Av. Corrientes 1234, CABA"
                className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 focus:border-[#2563EB]/50 focus:ring-0"
              />
            </FormField>

            <FormField label="Teléfono" name="phone" error={errors.phone?.message}>
              <Input
                {...register('phone')}
                placeholder="Ej: +54 11 1234-5678"
                className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 focus:border-[#2563EB]/50 focus:ring-0"
              />
            </FormField>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                {loading ? 'Creando...' : 'Crear empresa'}
              </button>
            </div>
          </form>
        </div>

        <p className="text-xs text-slate-600 mt-4 text-center">
          Al crear la empresa quedás como <span className="text-slate-400">propietario</span> y podés agregar miembros después.
        </p>
      </div>
    </>
  );
}
