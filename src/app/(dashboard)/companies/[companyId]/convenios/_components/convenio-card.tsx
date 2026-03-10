'use client';

import { ChevronDown, ChevronRight, Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { useTranslation } from '@/lib/i18n';
import type { Convenio, ConvenioCategory } from '@/lib/types/convenio';

export interface ConvenioCardProps {
  convenio: Convenio;
  isExpanded: boolean;
  onToggle: () => void;
  t: ReturnType<typeof useTranslation>;
  badgeVariant: 'own' | 'global';
  canEdit: boolean;
  onClone?: () => void;
  isCloning?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddCategory?: () => void;
  onEditCategory?: (cat: ConvenioCategory) => void;
  onDeleteCategory?: (cat: ConvenioCategory) => void;
}

export function ConvenioCard({
  convenio,
  isExpanded,
  onToggle,
  t,
  badgeVariant,
  canEdit: canEditProp,
  onClone,
  isCloning,
  onEdit,
  onDelete,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}: ConvenioCardProps) {
  const Chevron = isExpanded ? ChevronDown : ChevronRight;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111827] overflow-hidden">
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        <Chevron className="w-4 h-4 text-slate-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">{convenio.name}</span>
            <span className="text-xs text-slate-500 font-mono">{convenio.code}</span>
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
                badgeVariant === 'global'
                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/20'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
              )}
            >
              {badgeVariant === 'global' ? t.convenios.isGlobal : t.convenios.isOwn}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {convenio.categories.length} {t.convenios.categories.toLowerCase()}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {canEditProp && onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              title={t.common.edit}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {canEditProp && onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors"
              title={t.common.delete}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onClone && (
            <button
              onClick={onClone}
              disabled={isCloning}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:border-[#2563EB]/50 transition-colors disabled:opacity-50"
            >
              <Copy className="w-3.5 h-3.5" />
              {isCloning ? t.convenios.cloning : t.convenios.clone}
            </button>
          )}
        </div>
      </div>

      {/* Expanded: categories table */}
      {isExpanded && (
        <div className="border-t border-white/[0.06] px-4 py-3">
          {canEditProp && onAddCategory && (
            <div className="flex justify-end mb-2">
              <button
                onClick={onAddCategory}
                className="inline-flex items-center gap-1.5 text-xs text-[#2563EB] hover:text-[#93BBFC] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {t.convenios.addCategory}
              </button>
            </div>
          )}

          {convenio.categories.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase">
                  <th className="text-left pb-2 font-medium">{t.convenios.code}</th>
                  <th className="text-left pb-2 font-medium">{t.convenios.name}</th>
                  <th className="text-right pb-2 font-medium">{t.convenios.baseSalary}</th>
                  <th className="text-right pb-2 font-medium">{t.convenios.hourlyRate}</th>
                  {canEditProp && <th className="w-20" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {convenio.categories.map((cat) => (
                  <tr key={cat.id} className="text-slate-300">
                    <td className="py-2 font-mono text-xs">{cat.code}</td>
                    <td className="py-2">{cat.name}</td>
                    <td className="py-2 text-right">
                      <CurrencyDisplay amount={Number(cat.baseSalary)} />
                    </td>
                    <td className="py-2 text-right">
                      <CurrencyDisplay amount={Number(cat.hourlyRate)} />
                    </td>
                    {canEditProp && (
                      <td className="py-2">
                        <div className="flex justify-end gap-1">
                          {onEditCategory && (
                            <button
                              onClick={() => onEditCategory(cat)}
                              className="p-1 rounded text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                              title={t.convenios.editCategory}
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
                          {onDeleteCategory && (
                            <button
                              onClick={() => onDeleteCategory(cat)}
                              className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors"
                              title={t.convenios.deleteCategory}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-500 text-center py-2">
              {t.convenios.noCategories}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
