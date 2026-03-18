'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';
import type { Translations } from '@/lib/i18n/es';
import type { ConvenioUploadResponse } from '@/lib/types/convenio';

interface StepReviewProps {
  t: Translations;
  data: ConvenioUploadResponse;
  onConfirm: (edited: ConvenioUploadResponse) => void;
  onBack: () => void;
}

export function StepReview({ t, data, onConfirm, onBack }: StepReviewProps) {
  const u = t.convenios.upload;
  const [form, setForm] = useState<ConvenioUploadResponse>({ ...data });
  const [showNotes, setShowNotes] = useState(false);

  function updateField<K extends keyof ConvenioUploadResponse>(
    key: K,
    value: ConvenioUploadResponse[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ── Category helpers ─────────────────────────────────────────────────────
  function updateCategory(
    idx: number,
    field: 'code' | 'name' | 'baseSalary',
    value: string | number,
  ) {
    setForm((prev) => {
      const cats = [...prev.categories];
      cats[idx] = { ...cats[idx], [field]: value };
      return { ...prev, categories: cats };
    });
  }

  function addCategory() {
    setForm((prev) => ({
      ...prev,
      categories: [...prev.categories, { code: '', name: '', baseSalary: 0 }],
    }));
  }

  function removeCategory(idx: number) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== idx),
    }));
  }

  // ── Seniority rule helpers ────────────────────────────────────────────────
  function updateRule(
    idx: number,
    field: 'minYears' | 'maxYears' | 'percentage',
    value: number | null,
  ) {
    setForm((prev) => {
      const rules = [...prev.seniorityRules];
      rules[idx] = { ...rules[idx], [field]: value };
      return { ...prev, seniorityRules: rules };
    });
  }

  function addRule() {
    setForm((prev) => ({
      ...prev,
      seniorityRules: [...prev.seniorityRules, { minYears: 0, maxYears: null, percentage: 0 }],
    }));
  }

  function removeRule(idx: number) {
    setForm((prev) => ({
      ...prev,
      seniorityRules: prev.seniorityRules.filter((_, i) => i !== idx),
    }));
  }

  const isLowConfidence = form.confidence < 0.7;

  return (
    <div className="space-y-6">
      {/* Confidence badge */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{u.confidence}:</span>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium',
            isLowConfidence
              ? 'border-red-500/30 bg-red-500/10 text-red-400'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
          )}
        >
          {isLowConfidence && <AlertTriangle className="w-3 h-3" />}
          {Math.round(form.confidence * 100)}%
        </span>
      </div>

      {isLowConfidence && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-3">
          <p className="text-sm text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {u.confidenceLow}
          </p>
        </div>
      )}

      {/* Basic fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>{u.name}</Label>
          <Input
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-2">
          <Label>{t.common.notes}</Label>
          <Input
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label>{u.validFrom}</Label>
          <Input
            type="date"
            value={form.validFrom ?? ''}
            onChange={(e) => updateField('validFrom', e.target.value || null)}
            className="mt-1"
          />
        </div>
        <div>
          <Label>{u.validTo}</Label>
          <Input
            type="date"
            value={form.validTo ?? ''}
            onChange={(e) => updateField('validTo', e.target.value || null)}
            className="mt-1"
          />
        </div>
        <div>
          <Label>{u.vacationDays}</Label>
          <Input
            type="number"
            min={0}
            value={form.vacationDays ?? ''}
            onChange={(e) =>
              updateField('vacationDays', e.target.value ? Number(e.target.value) : null)
            }
            className="mt-1"
          />
        </div>
        <div>
          <Label>{u.sickLeaveDays}</Label>
          <Input
            type="number"
            min={0}
            value={form.sickLeaveDays ?? ''}
            onChange={(e) =>
              updateField('sickLeaveDays', e.target.value ? Number(e.target.value) : null)
            }
            className="mt-1"
          />
        </div>
      </div>

      {/* Categories table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{u.categories}</h3>
          <Button variant="outline" size="sm" onClick={addCategory} className="gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" />
            {u.addCategory}
          </Button>
        </div>
        {form.categories.length > 0 ? (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-overlay-subtle text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">{u.code}</th>
                  <th className="px-3 py-2 font-medium">{u.name}</th>
                  <th className="px-3 py-2 font-medium">{u.baseSalary}</th>
                  <th className="px-3 py-2 font-medium w-12" />
                </tr>
              </thead>
              <tbody>
                {form.categories.map((cat, idx) => (
                  <tr key={idx} className="border-t border-border">
                    <td className="px-3 py-2">
                      <Input
                        value={cat.code}
                        onChange={(e) => updateCategory(idx, 'code', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={cat.name}
                        onChange={(e) => updateCategory(idx, 'name', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        value={cat.baseSalary}
                        onChange={(e) => updateCategory(idx, 'baseSalary', Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => removeCategory(idx)}
                        className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title={u.removeRow}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t.convenios.noCategories}</p>
        )}
      </div>

      {/* Seniority rules table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{u.seniorityRules}</h3>
          <Button variant="outline" size="sm" onClick={addRule} className="gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" />
            {u.addRule}
          </Button>
        </div>
        {form.seniorityRules.length > 0 ? (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-overlay-subtle text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">{u.minYears}</th>
                  <th className="px-3 py-2 font-medium">{u.maxYears}</th>
                  <th className="px-3 py-2 font-medium">{u.percentage}</th>
                  <th className="px-3 py-2 font-medium w-12" />
                </tr>
              </thead>
              <tbody>
                {form.seniorityRules.map((rule, idx) => (
                  <tr key={idx} className="border-t border-border">
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        value={rule.minYears}
                        onChange={(e) => updateRule(idx, 'minYears', Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        value={rule.maxYears ?? ''}
                        placeholder={u.noUnlimited}
                        onChange={(e) =>
                          updateRule(idx, 'maxYears', e.target.value ? Number(e.target.value) : null)
                        }
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        step={0.1}
                        value={rule.percentage}
                        onChange={(e) => updateRule(idx, 'percentage', Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => removeRule(idx)}
                        className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title={u.removeRow}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">-</p>
        )}
      </div>

      {/* Raw notes collapsible */}
      {form.rawNotes && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showNotes ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {showNotes ? u.hideNotes : u.showNotes}
          </button>
          {showNotes && (
            <div className="rounded-xl border border-border bg-overlay-subtle p-4">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                {form.rawNotes}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={() => onConfirm(form)}
          disabled={!form.name.trim()}
          className="gap-2 bg-brand hover:bg-brand-hover text-white"
        >
          {u.stepConfirm}
        </Button>
        <Button variant="outline" onClick={onBack}>
          {u.backToUpload}
        </Button>
      </div>
    </div>
  );
}
