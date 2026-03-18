'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Pencil, Trash2, Plus } from 'lucide-react';
import { useTranslation, useLocaleId } from '@/lib/i18n';
import type { Convenio, ConvenioCategory } from '@/lib/types/convenio';

interface ConvenioCardProps {
  convenio: Convenio;
  canWrite: boolean;
  onEditConvenio: (c: Convenio) => void;
  onDeleteConvenio: (c: Convenio) => void;
  onAddCategory: (c: Convenio) => void;
  onEditCategory: (cat: ConvenioCategory) => void;
  onDeleteCategory: (cat: ConvenioCategory) => void;
}

export function ConvenioCard({
  convenio,
  canWrite,
  onEditConvenio,
  onDeleteConvenio,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}: ConvenioCardProps) {
  const [expanded, setExpanded] = useState(false);
  const t = useTranslation();
  const localeId = useLocaleId();
  const nf = useMemo(() => new Intl.NumberFormat(localeId, { style: 'currency', currency: 'ARS' }), [localeId]);

  const rulesCount =
    (convenio.seniorityBonusRules?.length ?? 0) +
    (convenio.vacationRules?.length ?? 0) +
    (convenio.sickLeaveRules?.length ?? 0);

  return (
    <div className="bg-secondary border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded); } }}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-overlay-subtle transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono text-xs text-muted-foreground bg-overlay-subtle px-2 py-0.5 rounded border border-border shrink-0">
            {convenio.code}
          </span>
          <span className="text-sm font-medium text-foreground truncate">{convenio.name}</span>
          <span className="text-xs text-muted-foreground shrink-0">
            {convenio.categories.length} {t.convenios.categories.toLowerCase()}
          </span>
          {rulesCount > 0 && (
            <span className="text-[10px] text-muted-foreground shrink-0">
              {rulesCount} {t.convenios.addRule.split(' ').pop()}(s)
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {canWrite && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onEditConvenio(convenio); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-overlay transition-colors cursor-pointer"
                aria-label={t.common.edit}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteConvenio(convenio); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/[0.06] transition-colors cursor-pointer"
                aria-label={t.common.delete}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border px-5 py-4">
          {/* Bracket rules summary */}
          {rulesCount > 0 && (
            <div className="flex flex-wrap gap-4 mb-4">
              {convenio.seniorityBonusRules && convenio.seniorityBonusRules.length > 0 && (
                <RuleSummary
                  label={t.convenios.seniorityBonusRules}
                  items={convenio.seniorityBonusRules.map((r) => `${r.minYears}-${r.maxYears}a: ${r.percentPerYear}%`)}
                />
              )}
              {convenio.vacationRules && convenio.vacationRules.length > 0 && (
                <RuleSummary
                  label={t.convenios.vacationRules}
                  items={convenio.vacationRules.map((r) => `${r.minYears}-${r.maxYears}a: ${r.days}d`)}
                />
              )}
              {convenio.sickLeaveRules && convenio.sickLeaveRules.length > 0 && (
                <RuleSummary
                  label={t.convenios.sickLeaveRules}
                  items={convenio.sickLeaveRules.map((r) => `${r.minYears}-${r.maxYears}a: ${r.days}d`)}
                />
              )}
            </div>
          )}

          {/* Categories list */}
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t.convenios.categories}
            </h4>
            {canWrite && (
              <button
                onClick={() => onAddCategory(convenio)}
                className="inline-flex items-center gap-1 text-xs text-brand hover:text-brand-text transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {t.convenios.addCategory}
              </button>
            )}
          </div>

          {convenio.categories.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">{t.convenios.noCategories}</p>
          ) : (
            <div className="flex flex-col gap-1">
              {convenio.categories
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-overlay-subtle border border-border hover:bg-overlay-subtle transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-[10px] text-muted-foreground bg-overlay-subtle px-1.5 py-0.5 rounded">
                        {cat.code}
                      </span>
                      <span className="text-sm text-foreground truncate">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-xs text-muted-foreground">{nf.format(Number(cat.baseSalary))}</span>
                      <span className="font-mono text-xs text-muted-foreground">{nf.format(Number(cat.hourlyRate))}/h</span>
                      {canWrite && (
                        <div className="flex gap-0.5">
                          <button
                            onClick={() => onEditCategory(cat)}
                            className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-overlay transition-colors cursor-pointer"
                            aria-label={t.convenios.editCategory}
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDeleteCategory(cat)}
                            className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/[0.06] transition-colors cursor-pointer"
                            aria-label={t.convenios.deleteCategory}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Rule summary helper ─────────────────────────────────────────────────────

function RuleSummary({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="bg-overlay-subtle border border-border rounded-lg px-3 py-2">
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, idx) => (
          <span key={idx} className="text-xs font-mono text-muted-foreground bg-overlay-subtle px-1.5 py-0.5 rounded">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
