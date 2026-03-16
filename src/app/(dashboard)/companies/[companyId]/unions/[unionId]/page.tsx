'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/utils/toast';
import { Pencil, Users, Hash, DollarSign, FileText } from 'lucide-react';
import Link from 'next/link';
import { getUnion, updateUnion } from '@/lib/api/unions';
import { updateUnionSchema, type UpdateUnionInput } from '@/lib/validators/union';
import { ROUTES } from '@/lib/constants/routes';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { RoleGate } from '@/components/shared/role-gate';
import { FormField } from '@/components/shared/form-field';
import { useTranslation } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import type { Union } from '@/lib/types/union';

export default function UnionDetailPage() {
  const { companyId, unionId } = useParams<{ companyId: string; unionId: string }>();
  const t = useTranslation();

  const [union, setUnion] = useState<Union | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!companyId || !unionId) return;
    setIsLoading(true);
    try {
      const data = await getUnion(companyId, unionId);
      setUnion(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.unions.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, unionId, t]);

  useEffect(() => { load(); }, [load]);

  const form = useForm<UpdateUnionInput>({
    resolver: zodResolver(updateUnionSchema(t.validators)),
  });

  useEffect(() => {
    if (union && editMode) {
      form.reset({
        name: union.name,
        code: union.code,
        duesType: union.duesType,
        duesValue: String(union.duesValue),
        description: union.description ?? '',
        isActive: union.isActive,
      });
    }
  }, [union, editMode, form]);

  async function onSave(data: UpdateUnionInput) {
    if (!union) return;
    setSaving(true);
    try {
      const updated = await updateUnion(companyId, unionId, {
        ...data,
        duesValue: data.duesValue ? parseFloat(data.duesValue) : undefined,
        description: data.description || undefined,
      });
      setUnion(updated);
      setEditMode(false);
      toast.success(t.unions.updated);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.unions.saveError);
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/[0.05] rounded motion-safe:animate-pulse" />
        <div className="rounded-xl border border-white/[0.06] p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-5 bg-white/[0.05] rounded motion-safe:animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!union) return null;

  const duesLabel = union.duesType === 'PERCENTAGE' ? t.unions.duesPercentage : t.unions.duesFixedAmount;
  const duesDisplay = union.duesType === 'PERCENTAGE' ? `${union.duesValue}%` : `$${union.duesValue.toLocaleString()}`;

  return (
    <>
      <PageHeader
        title={union.name}
        description={union.code}
        backHref={ROUTES.unions(companyId)}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={union.isActive ? 'active' : 'inactive'} />
            <RoleGate roles={['OWNER', 'ADMIN']}>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-sm text-slate-300 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {t.common.edit}
                </button>
              )}
            </RoleGate>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info / Edit card */}
        <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
          {editMode ? (
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
              <FormField label={t.unions.name} name="name" error={form.formState.errors.name?.message} required>
                <Input {...form.register('name')} />
              </FormField>

              <FormField label={t.unions.code} name="code" error={form.formState.errors.code?.message} required>
                <Input {...form.register('code')} />
              </FormField>

              <FormField label={t.unions.duesType} name="duesType" error={form.formState.errors.duesType?.message} required>
                <Controller
                  control={form.control}
                  name="duesType"
                  render={({ field }) => (
                    <select
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      className="flex h-10 w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/50"
                    >
                      <option value="PERCENTAGE">{t.unions.duesPercentage}</option>
                      <option value="FIXED_AMOUNT">{t.unions.duesFixedAmount}</option>
                    </select>
                  )}
                />
              </FormField>

              <FormField label={t.unions.duesValue} name="duesValue" error={form.formState.errors.duesValue?.message} required>
                <Input {...form.register('duesValue')} type="text" inputMode="decimal" />
              </FormField>

              <FormField label={t.unions.descriptionLabel} name="description" error={form.formState.errors.description?.message}>
                <Input {...form.register('description')} placeholder={t.unions.descriptionPlaceholder} />
              </FormField>

              <FormField label={t.unions.isActive} name="isActive" error={form.formState.errors.isActive?.message}>
                <Controller
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.value ?? false}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-4 w-4 rounded border-white/[0.2] bg-white/[0.04] text-[#2563EB] focus:ring-[#2563EB]/50"
                      />
                      <span className="text-sm text-slate-300">{t.unions.isActive}</span>
                    </label>
                  )}
                />
              </FormField>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-[#2563EB]/90 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {saving ? t.common.saving : t.common.save}
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-sm text-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  {t.common.cancel}
                </button>
              </div>
            </form>
          ) : (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoItem icon={<Hash className="w-4 h-4" />} label={t.unions.code} value={union.code} />
              <InfoItem icon={<FileText className="w-4 h-4" />} label={t.unions.duesType} value={duesLabel} />
              <InfoItem icon={<DollarSign className="w-4 h-4" />} label={t.unions.duesValue} value={duesDisplay} />
              <InfoItem icon={<Users className="w-4 h-4" />} label={t.unions.activeMembers} value={String(union.activeMembersCount ?? 0)} />
              {union.description && (
                <div className="sm:col-span-2">
                  <InfoItem icon={<FileText className="w-4 h-4" />} label={t.unions.descriptionLabel} value={union.description} />
                </div>
              )}
            </dl>
          )}
        </div>

        {/* Side card — quick link to members */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col gap-4">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">{t.unions.members}</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#2563EB]/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#2563EB]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{union.activeMembersCount ?? 0}</p>
              <p className="text-xs text-slate-400">{t.unions.activeMembers}</p>
            </div>
          </div>
          <Link
            href={ROUTES.unionMembers(companyId, unionId)}
            className="mt-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-sm text-slate-300 transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            {t.unions.membersTitle}
          </Link>
        </div>
      </div>
    </>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-slate-500">{icon}</div>
      <div>
        <dt className="text-xs text-slate-400">{label}</dt>
        <dd className="text-sm text-slate-200 mt-0.5">{value}</dd>
      </div>
    </div>
  );
}
