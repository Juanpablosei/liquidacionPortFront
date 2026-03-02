'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { useCompanyStore } from '@/stores/company-store';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { getCompany, updateCompany } from '@/lib/api/companies';
import { updateCompanySchema, type UpdateCompanyInput } from '@/lib/validators/company';
import { ROUTES } from '@/lib/constants/routes';
import { PageHeader } from '@/components/shared/page-header';
import { FormField } from '@/components/shared/form-field';
import { Input } from '@/components/ui/input';
import type { Company } from '@/lib/types/company';

export default function CompanySettingsPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const router = useRouter();
  const { updateCompany: updateStore } = useCompanyStore();
  const { canEdit, isOwner } = usePermissions();

  const [company,  setCompany]  = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving,    setSaving]   = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateCompanyInput>({
    resolver: zodResolver(updateCompanySchema),
  });

  useEffect(() => {
    getCompany(companyId)
      .then((co) => {
        setCompany(co);
        reset({
          name:    co.name,
          taxId:   co.taxId    ?? '',
          address: co.address  ?? '',
          phone:   co.phone    ?? '',
        });
      })
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setIsLoading(false));
  }, [companyId, reset]);

  async function onSubmit(data: UpdateCompanyInput) {
    setSaving(true);
    try {
      const payload = {
        name:    data.name,
        taxId:   data.taxId   || undefined,
        address: data.address || undefined,
        phone:   data.phone   || undefined,
      };
      const updated = await updateCompany(companyId, payload);
      updateStore(updated);
      setCompany(updated);
      reset({
        name:    updated.name,
        taxId:   updated.taxId    ?? '',
        address: updated.address  ?? '',
        phone:   updated.phone    ?? '',
      });
      toast.success('Empresa actualizada');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <SettingsSkeleton />;

  return (
    <>
      <PageHeader
        title="Configuración"
        description="Datos generales de la empresa."
        backHref={ROUTES.company(companyId)}
      />

      <div className="max-w-lg flex flex-col gap-6">

        {/* General settings */}
        <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-5">Datos generales</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField label="Nombre de la empresa" name="name" error={errors.name?.message} required>
              <Input
                {...register('name')}
                disabled={!canEdit()}
                className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 disabled:opacity-50"
              />
            </FormField>

            <FormField label="CUIT" name="taxId" error={errors.taxId?.message} hint="Sin guiones.">
              <Input
                {...register('taxId')}
                disabled={!canEdit()}
                placeholder="Ej: 30712345678"
                className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 disabled:opacity-50"
              />
            </FormField>

            <FormField label="Dirección" name="address" error={errors.address?.message}>
              <Input
                {...register('address')}
                disabled={!canEdit()}
                placeholder="Ej: Av. Corrientes 1234, CABA"
                className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 disabled:opacity-50"
              />
            </FormField>

            <FormField label="Teléfono" name="phone" error={errors.phone?.message}>
              <Input
                {...register('phone')}
                disabled={!canEdit()}
                placeholder="Ej: +54 11 1234-5678"
                className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 disabled:opacity-50"
              />
            </FormField>

            {canEdit() && (
              <button
                type="submit"
                disabled={saving || !isDirty}
                className="mt-1 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            )}
          </form>
        </div>

        {/* Danger zone - only OWNER */}
        {isOwner() && (
          <div className="bg-[#0F172A] border border-red-500/20 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-semibold text-red-400">Zona de peligro</h2>
            </div>
            <p className="text-sm text-slate-400 mb-5 leading-relaxed">
              Para transferir la propiedad de la empresa a otro miembro, andá a la sección{' '}
              <strong className="text-white">Miembros</strong> y usá la opción "Transferir ownership".
            </p>
            <div className="p-3 bg-red-500/[0.06] border border-red-500/20 rounded-lg text-xs text-red-300 leading-relaxed">
              Esta acción es <strong>irreversible</strong>. Después de transferir el ownership, pasás a ser ADMIN.
            </div>
          </div>
        )}

        {/* Read-only info */}
        <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Información</h2>
          <div className="flex flex-col gap-3">
            <InfoRow label="ID" value={company?.id ?? '—'} mono />
            <InfoRow
              label="Creada el"
              value={company ? new Date(company.createdAt).toLocaleDateString('es-AR', {
                day: '2-digit', month: 'long', year: 'numeric',
              }) : '—'}
            />
            <InfoRow
              label="Última modificación"
              value={company ? new Date(company.updatedAt).toLocaleDateString('es-AR', {
                day: '2-digit', month: 'long', year: 'numeric',
              }) : '—'}
            />
            <InfoRow label="Estado" value={company?.isActive ? 'Activa' : 'Inactiva'} />
          </div>
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm text-white truncate ${mono ? 'font-mono text-xs text-slate-400' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <>
      <div className="flex items-start gap-4 mb-8 animate-pulse">
        <div>
          <div className="h-6 bg-white/[0.06] rounded w-40 mb-2" />
          <div className="h-4 bg-white/[0.04] rounded w-60" />
        </div>
      </div>
      <div className="max-w-lg bg-[#0F172A] border border-white/[0.06] rounded-xl p-6 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="mb-5">
            <div className="h-3 bg-white/[0.06] rounded w-24 mb-2" />
            <div className="h-10 bg-white/[0.04] rounded" />
          </div>
        ))}
      </div>
    </>
  );
}
