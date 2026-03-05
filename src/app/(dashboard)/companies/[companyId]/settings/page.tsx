'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { AlertTriangle, Plus, Trash2, Loader2 } from 'lucide-react';
import { useCompanyStore } from '@/stores/company-store';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { getCompany, updateCompany } from '@/lib/api/companies';
import { getSettlementConfig, updateSettlementConfig } from '@/lib/api/settlements';
import { updateCompanySchema, type UpdateCompanyInput } from '@/lib/validators/company';
import { ROUTES } from '@/lib/constants/routes';
import { PageHeader } from '@/components/shared/page-header';
import { FormField } from '@/components/shared/form-field';
import { Input } from '@/components/ui/input';
import { useTranslation, useLocaleId } from '@/lib/i18n';
import type { Company } from '@/lib/types/company';
import type { RuleBracket, SettlementConfig } from '@/lib/types/settlement';

export default function CompanySettingsPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const router = useRouter();
  const { updateCompany: updateStore } = useCompanyStore();
  const { canEdit, isOwner } = usePermissions();
  const t = useTranslation();
  const localeId = useLocaleId();

  const [company,  setCompany]  = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving,    setSaving]   = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateCompanyInput>({
    resolver: zodResolver(updateCompanySchema(t.validators)),
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
      toast.success(t.companies.settings.updated);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.companies.settings.updated);
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <SettingsSkeleton />;

  return (
    <>
      <PageHeader
        title={t.companies.settings.title}
        description={t.companies.settings.description}
        backHref={ROUTES.company(companyId)}
      />

      <div className="max-w-2xl flex flex-col gap-6">

        {/* General settings */}
        <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-5">{t.companies.settings.general}</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField label={t.companies.settings.companyName} name="name" error={errors.name?.message} required>
              <Input
                {...register('name')}
                maxLength={100}
                disabled={!canEdit()}
                className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 disabled:opacity-50"
              />
            </FormField>

            <FormField label={t.companies.settings.cuit} name="taxId" error={errors.taxId?.message} hint={t.companies.settings.cuitHint}>
              <Input
                {...register('taxId')}
                maxLength={13}
                inputMode="numeric"
                disabled={!canEdit()}
                placeholder={t.companies.settings.cuitPlaceholder}
                className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 disabled:opacity-50"
              />
            </FormField>

            <FormField label={t.companies.settings.address} name="address" error={errors.address?.message}>
              <Input
                {...register('address')}
                maxLength={200}
                disabled={!canEdit()}
                placeholder={t.companies.settings.addressPlaceholder}
                className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 disabled:opacity-50"
              />
            </FormField>

            <FormField label={t.companies.settings.phone} name="phone" error={errors.phone?.message}>
              <Input
                {...register('phone')}
                type="tel"
                maxLength={20}
                disabled={!canEdit()}
                placeholder={t.companies.settings.phonePlaceholder}
                className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 disabled:opacity-50"
              />
            </FormField>

            {canEdit() && (
              <button
                type="submit"
                disabled={saving || !isDirty}
                className="mt-1 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                {saving ? t.common.saving : t.companies.settings.saveChanges}
              </button>
            )}
          </form>
        </div>

        {/* Settlement config — OWNER/ADMIN */}
        {canEdit() && (
          <SettlementConfigSection companyId={companyId} t={t} />
        )}

        {/* Danger zone - only OWNER */}
        {isOwner() && (
          <div className="bg-[#0F172A] border border-red-500/20 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-semibold text-red-400">{t.companies.settings.dangerZone}</h2>
            </div>
            <p className="text-sm text-slate-400 mb-5 leading-relaxed">
              {t.companies.settings.transferNote}
            </p>
            <div className="p-3 bg-red-500/[0.06] border border-red-500/20 rounded-lg text-xs text-red-300 leading-relaxed">
              {t.companies.settings.transferWarning}
            </div>
          </div>
        )}

        {/* Read-only info */}
        <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">{t.common.information}</h2>
          <div className="flex flex-col gap-3">
            <InfoRow label={t.common.id} value={company?.id ?? '—'} mono />
            <InfoRow
              label={t.companies.settings.createdAt}
              value={company ? new Date(company.createdAt).toLocaleDateString(localeId, {
                day: '2-digit', month: 'long', year: 'numeric',
              }) : '—'}
            />
            <InfoRow
              label={t.companies.settings.lastModified}
              value={company ? new Date(company.updatedAt).toLocaleDateString(localeId, {
                day: '2-digit', month: 'long', year: 'numeric',
              }) : '—'}
            />
            <InfoRow label={t.common.status} value={company?.isActive ? t.common.active : t.common.inactive} />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Settlement Config Section ─────────────────────────────────────────────

type Translations = ReturnType<typeof useTranslation>;

function SettlementConfigSection({ companyId, t }: { companyId: string; t: Translations }) {
  const [config, setConfig]   = useState<SettlementConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  const [noticePeriodRules, setNoticePeriodRules] = useState<RuleBracket[]>([]);
  const [severanceDays, setSeveranceDays]         = useState(15);
  const [vacationRules, setVacationRules]         = useState<RuleBracket[]>([]);

  useEffect(() => {
    getSettlementConfig(companyId)
      .then((cfg) => {
        setConfig(cfg);
        setNoticePeriodRules(cfg.noticePeriodRules ?? []);
        setSeveranceDays(cfg.severanceDaysPerYear ?? 15);
        setVacationRules(cfg.vacationRules ?? []);
      })
      .catch(() => { /* config not created yet — use defaults */ })
      .finally(() => setLoading(false));
  }, [companyId]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateSettlementConfig(companyId, {
        noticePeriodRules,
        severanceDaysPerYear: severanceDays,
        vacationRules,
      });
      setConfig(updated);
      toast.success(t.settlements.config.saved);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-6">
      <h2 className="text-sm font-semibold text-white mb-1">{t.settlements.config.title}</h2>
      <p className="text-xs text-slate-400 mb-5">{t.settlements.config.description}</p>

      <div className="flex flex-col gap-6">
        {/* Notice period rules */}
        <RulesTable
          label={t.settlements.config.noticePeriodRules}
          rules={noticePeriodRules}
          onChange={setNoticePeriodRules}
          t={t}
        />

        {/* Severance days per year */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">
            {t.settlements.config.severanceDaysPerYear}
          </label>
          <Input
            type="number"
            min={1}
            value={severanceDays}
            onChange={(e) => setSeveranceDays(Number(e.target.value) || 15)}
            className="bg-white/[0.05] border-white/[0.1] text-white w-32"
          />
        </div>

        {/* Vacation rules */}
        <RulesTable
          label={t.settlements.config.vacationRules}
          rules={vacationRules}
          onChange={setVacationRules}
          t={t}
        />

        <button
          onClick={handleSave}
          disabled={saving}
          aria-busy={saving}
          className="self-start bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
        >
          {saving ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 motion-safe:animate-spin" />{t.common.saving}</span> : t.settlements.config.save}
        </button>
      </div>
    </div>
  );
}

function RulesTable({
  label,
  rules,
  onChange,
  t,
}: {
  label:    string;
  rules:    RuleBracket[];
  onChange: (rules: RuleBracket[]) => void;
  t:        Translations;
}) {
  function addRule() {
    const last = rules[rules.length - 1];
    onChange([...rules, { minYears: last ? last.maxYears : 0, maxYears: (last ? last.maxYears : 0) + 5, days: 0 }]);
  }

  function removeRule(idx: number) {
    onChange(rules.filter((_, i) => i !== idx));
  }

  function updateRule(idx: number, field: keyof RuleBracket, value: number) {
    onChange(rules.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  return (
    <div>
      <label className="text-sm font-medium text-slate-300 block mb-2">{label}</label>
      {rules.length > 0 && (
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 mb-2">
          <span className="text-xs text-slate-500 px-1">{t.settlements.config.minYears}</span>
          <span className="text-xs text-slate-500 px-1">{t.settlements.config.maxYears}</span>
          <span className="text-xs text-slate-500 px-1">{t.settlements.config.days}</span>
          <span />
          {rules.map((rule, i) => (
            <React.Fragment key={i}>
              <Input
                type="number" min={0} value={rule.minYears}
                onChange={(e) => updateRule(i, 'minYears', Number(e.target.value) || 0)}
                className="bg-white/[0.05] border-white/[0.1] text-white text-sm"
              />
              <Input
                type="number" min={0} value={rule.maxYears}
                onChange={(e) => updateRule(i, 'maxYears', Number(e.target.value) || 0)}
                className="bg-white/[0.05] border-white/[0.1] text-white text-sm"
              />
              <Input
                type="number" min={0} value={rule.days}
                onChange={(e) => updateRule(i, 'days', Number(e.target.value) || 0)}
                className="bg-white/[0.05] border-white/[0.1] text-white text-sm"
              />
              <button
                onClick={() => removeRule(i)}
                aria-label={t.settlements.config.removeRule}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
      <button
        onClick={addRule}
        className="inline-flex items-center gap-1.5 text-xs text-[#2563EB] hover:text-blue-400 transition-colors cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        {t.settlements.config.addRule}
      </button>
    </div>
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
      <div className="flex items-start gap-4 mb-8 motion-safe:animate-pulse">
        <div>
          <div className="h-6 bg-white/[0.06] rounded w-40 mb-2" />
          <div className="h-4 bg-white/[0.04] rounded w-60" />
        </div>
      </div>
      <div className="max-w-2xl bg-[#0F172A] border border-white/[0.06] rounded-xl p-6 motion-safe:animate-pulse">
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
