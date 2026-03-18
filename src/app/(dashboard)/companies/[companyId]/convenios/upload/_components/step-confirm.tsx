'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Translations } from '@/lib/i18n/es';
import type { ConvenioUploadResponse } from '@/lib/types/convenio';

interface StepConfirmProps {
  t: Translations;
  data: ConvenioUploadResponse;
  isConfirming: boolean;
  onConfirm: () => void;
  onBack: () => void;
}

export function StepConfirm({ t, data, isConfirming, onConfirm, onBack }: StepConfirmProps) {
  const u = t.convenios.upload;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-overlay-subtle p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">{u.confirmTitle}</h3>
        <p className="text-xs text-muted-foreground">{u.confirmDesc}</p>

        <div className="space-y-3 text-sm">
          <Row label={u.name} value={data.name} />
          <Row label={t.common.notes} value={data.description || '-'} />
          <Row label={u.validFrom} value={data.validFrom ?? '-'} />
          <Row label={u.validTo} value={data.validTo ?? '-'} />
          <Row
            label={u.vacationDays}
            value={data.vacationDays != null ? String(data.vacationDays) : '-'}
          />
          <Row
            label={u.sickLeaveDays}
            value={data.sickLeaveDays != null ? String(data.sickLeaveDays) : '-'}
          />
          <Row
            label={u.categories}
            value={u.nCategories.replace('{n}', String(data.categories.length))}
          />
          <Row
            label={u.seniorityRules}
            value={u.nRules.replace('{n}', String(data.seniorityRules.length))}
          />
        </div>

        {/* Categories summary */}
        {data.categories.length > 0 && (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-overlay-subtle text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">{u.code}</th>
                  <th className="px-3 py-2 font-medium">{u.name}</th>
                  <th className="px-3 py-2 font-medium text-right">{u.baseSalary}</th>
                </tr>
              </thead>
              <tbody>
                {data.categories.map((cat, idx) => (
                  <tr key={idx} className="border-t border-border text-muted-foreground">
                    <td className="px-3 py-1.5 font-mono">{cat.code}</td>
                    <td className="px-3 py-1.5">{cat.name}</td>
                    <td className="px-3 py-1.5 text-right font-mono">
                      {cat.baseSalary.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Seniority rules summary */}
        {data.seniorityRules.length > 0 && (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-overlay-subtle text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">{u.minYears}</th>
                  <th className="px-3 py-2 font-medium">{u.maxYears}</th>
                  <th className="px-3 py-2 font-medium text-right">{u.percentage}</th>
                </tr>
              </thead>
              <tbody>
                {data.seniorityRules.map((rule, idx) => (
                  <tr key={idx} className="border-t border-border text-muted-foreground">
                    <td className="px-3 py-1.5 font-mono">{rule.minYears}</td>
                    <td className="px-3 py-1.5 font-mono">
                      {rule.maxYears != null ? rule.maxYears : u.noUnlimited}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono">{rule.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={onConfirm}
          disabled={isConfirming}
          className="gap-2 bg-brand hover:bg-brand-hover text-white"
        >
          {isConfirming && <Loader2 className="w-4 h-4 animate-spin" />}
          {isConfirming ? u.confirming : u.confirmBtn}
        </Button>
        <Button variant="outline" onClick={onBack} disabled={isConfirming}>
          {u.backToReview}
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-foreground text-right">{value}</span>
    </div>
  );
}
