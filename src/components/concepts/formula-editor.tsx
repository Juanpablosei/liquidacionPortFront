'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, Loader2, Info } from 'lucide-react';
import { validateFormula } from '@/lib/api/concepts';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';
import type { FormulaValidationResult } from '@/lib/types/payroll';

const FORMULA_VARIABLES = [
  'BASICO',
  'BRUTO',
  'HORAS_TRABAJADAS',
  'VALOR_HORA',
  'ANTIGUEDAD_ANOS',
  'DIAS_TRABAJADOS',
  'PRESENTISMO',
  'HORAS_EXTRA_50',
  'HORAS_EXTRA_100',
] as const;

const INPUT_CLASS =
  'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 focus:border-[#2563EB]/50 focus:ring-0';

interface FormulaEditorProps {
  companyId: string;
  value: string;
  onChange: (formula: string) => void;
  error?: string;
}

export function FormulaEditor({ companyId, value, onChange, error }: FormulaEditorProps) {
  const t = useTranslation();
  const [validation, setValidation] = useState<FormulaValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const debouncedFormula = useDebounce(value, 500);

  const runValidation = useCallback(
    async (formula: string) => {
      if (!formula.trim()) {
        setValidation(null);
        return;
      }
      setIsValidating(true);
      try {
        const result = await validateFormula(companyId, formula);
        setValidation(result);
      } catch {
        setValidation({ valid: false, error: t.concepts.formulaError });
      } finally {
        setIsValidating(false);
      }
    },
    [companyId, t.concepts.formulaError],
  );

  useEffect(() => {
    runValidation(debouncedFormula);
  }, [debouncedFormula, runValidation]);

  function insertVariable(variable: string) {
    const next = value ? `${value} ${variable}` : variable;
    if (next.length <= 500) {
      onChange(next);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Input */}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder={t.concepts.formulaPlaceholder}
          className={cn(
            INPUT_CLASS,
            'w-full rounded-lg border px-3 py-2 text-sm font-mono resize-none',
            error && 'border-red-500/50',
          )}
        />
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5">
            {isValidating && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                {t.concepts.formulaValidating}
              </span>
            )}
            {!isValidating && validation?.valid && (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                {t.concepts.formulaValid}
              </span>
            )}
            {!isValidating && validation && !validation.valid && (
              <span className="flex items-center gap-1 text-xs text-red-400">
                <XCircle className="w-3 h-3" />
                {validation.error ?? t.concepts.formulaInvalid}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-600 font-mono">
            {value.length}/500 {t.concepts.formulaChars}
          </span>
        </div>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>

      {/* Preview */}
      {validation?.valid && validation.preview !== undefined && (
        <div className="rounded-lg bg-emerald-500/[0.08] border border-emerald-500/20 px-3 py-2">
          <p className="text-xs text-emerald-300 font-medium mb-0.5">
            {t.concepts.formulaPreview}
          </p>
          <p className="text-sm text-emerald-200 font-mono">
            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(
              validation.preview,
            )}
          </p>
          <p className="text-[10px] text-emerald-400/60 mt-1">
            {t.concepts.formulaPreviewNote}
          </p>
        </div>
      )}

      {/* Variables reference */}
      <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-2">
          <Info className="w-3 h-3 text-slate-500" />
          <span className="text-xs text-slate-400 font-medium">
            {t.concepts.formulaVariables}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FORMULA_VARIABLES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => insertVariable(v)}
              className="px-2 py-0.5 rounded text-[11px] font-mono bg-white/[0.06] border border-white/[0.08] text-slate-300 hover:bg-[#2563EB]/20 hover:border-[#2563EB]/30 hover:text-[#93BBFC] transition-colors cursor-pointer"
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
