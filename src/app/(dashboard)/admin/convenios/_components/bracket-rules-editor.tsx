'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

const INPUT_CLASS =
  'bg-overlay border-border text-foreground placeholder:text-muted-foreground focus:border-brand/50 focus:ring-0';

// ─── Seniority Bonus Rules ──────────────────────────────────────────────────

interface SeniorityBonusRow {
  minYears: number;
  maxYears: number;
  percentPerYear: number;
}

interface SeniorityBonusEditorProps {
  value: SeniorityBonusRow[];
  onChange: (rows: SeniorityBonusRow[]) => void;
  readOnly?: boolean;
}

export function SeniorityBonusEditor({ value, onChange, readOnly }: SeniorityBonusEditorProps) {
  const t = useTranslation();

  function addRow() {
    const last = value[value.length - 1];
    onChange([...value, { minYears: last ? last.maxYears : 0, maxYears: last ? last.maxYears + 5 : 5, percentPerYear: 1 }]);
  }

  function removeRow(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function updateRow(idx: number, field: keyof SeniorityBonusRow, val: string) {
    const rows = [...value];
    rows[idx] = { ...rows[idx], [field]: Number(val) || 0 };
    onChange(rows);
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-muted-foreground">{t.convenios.seniorityBonusRules}</label>
      {value.map((row, idx) => (
        <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
          <Input
            type="number" min={0} value={row.minYears} disabled={readOnly}
            onChange={(e) => updateRow(idx, 'minYears', e.target.value)}
            placeholder={t.convenios.minYears} className={`${INPUT_CLASS} font-mono text-xs`}
          />
          <Input
            type="number" min={1} value={row.maxYears} disabled={readOnly}
            onChange={(e) => updateRow(idx, 'maxYears', e.target.value)}
            placeholder={t.convenios.maxYears} className={`${INPUT_CLASS} font-mono text-xs`}
          />
          <Input
            type="number" min={0} max={100} step={0.1} value={row.percentPerYear} disabled={readOnly}
            onChange={(e) => updateRow(idx, 'percentPerYear', e.target.value)}
            placeholder={t.convenios.percentPerYear} className={`${INPUT_CLASS} font-mono text-xs`}
          />
          {!readOnly && (
            <button
              type="button" onClick={() => removeRow(idx)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/[0.06] transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
      {value.length > 0 && (
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-[10px] text-muted-foreground -mt-1 px-1">
          <span>{t.convenios.minYears}</span>
          <span>{t.convenios.maxYears}</span>
          <span>{t.convenios.percentPerYear}</span>
          <span className="w-8" />
        </div>
      )}
      {!readOnly && (
        <button
          type="button" onClick={addRow}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer w-fit"
        >
          <Plus className="w-3.5 h-3.5" /> {t.convenios.addRule}
        </button>
      )}
    </div>
  );
}

// ─── Days-based Bracket Rules (vacation / sick leave) ───────────────────────

interface DaysRow {
  minYears: number;
  maxYears: number;
  days: number;
}

interface DaysBracketEditorProps {
  label: string;
  value: DaysRow[];
  onChange: (rows: DaysRow[]) => void;
  readOnly?: boolean;
}

export function DaysBracketEditor({ label, value, onChange, readOnly }: DaysBracketEditorProps) {
  const t = useTranslation();

  function addRow() {
    const last = value[value.length - 1];
    onChange([...value, { minYears: last ? last.maxYears : 0, maxYears: last ? last.maxYears + 5 : 5, days: 14 }]);
  }

  function removeRow(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function updateRow(idx: number, field: keyof DaysRow, val: string) {
    const rows = [...value];
    rows[idx] = { ...rows[idx], [field]: Number(val) || 0 };
    onChange(rows);
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      {value.map((row, idx) => (
        <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
          <Input
            type="number" min={0} value={row.minYears} disabled={readOnly}
            onChange={(e) => updateRow(idx, 'minYears', e.target.value)}
            placeholder={t.convenios.minYears} className={`${INPUT_CLASS} font-mono text-xs`}
          />
          <Input
            type="number" min={1} value={row.maxYears} disabled={readOnly}
            onChange={(e) => updateRow(idx, 'maxYears', e.target.value)}
            placeholder={t.convenios.maxYears} className={`${INPUT_CLASS} font-mono text-xs`}
          />
          <Input
            type="number" min={0} value={row.days} disabled={readOnly}
            onChange={(e) => updateRow(idx, 'days', e.target.value)}
            placeholder={t.convenios.days} className={`${INPUT_CLASS} font-mono text-xs`}
          />
          {!readOnly && (
            <button
              type="button" onClick={() => removeRow(idx)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/[0.06] transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
      {value.length > 0 && (
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-[10px] text-muted-foreground -mt-1 px-1">
          <span>{t.convenios.minYears}</span>
          <span>{t.convenios.maxYears}</span>
          <span>{t.convenios.days}</span>
          <span className="w-8" />
        </div>
      )}
      {!readOnly && (
        <button
          type="button" onClick={addRow}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer w-fit"
        >
          <Plus className="w-3.5 h-3.5" /> {t.convenios.addRule}
        </button>
      )}
    </div>
  );
}
