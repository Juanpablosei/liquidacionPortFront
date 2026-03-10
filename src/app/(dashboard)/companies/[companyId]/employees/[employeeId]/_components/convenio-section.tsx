'use client';

import { Pencil, ScrollText } from 'lucide-react';
import { RoleGate } from '@/components/shared/role-gate';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Employee } from '@/lib/types/employee';
import type { Convenio } from '@/lib/types/convenio';
import type { Translations } from '@/lib/i18n/es';
import { DataRow, INPUT_CLASS } from './shared';

interface ConvenioSectionProps {
  employee: Employee;
  convenios: Convenio[];
  selectedConvenioId: string;
  setSelectedConvenioId: (v: string) => void;
  selectedCategoryId: string;
  setSelectedCategoryId: (v: string) => void;
  editingConvenio: boolean;
  setEditingConvenio: (v: boolean) => void;
  savingConvenio: boolean;
  onSaveConvenio: () => void;
  onClearConvenio: () => void;
  t: Translations;
}

export function ConvenioSection({
  employee,
  convenios,
  selectedConvenioId,
  setSelectedConvenioId,
  selectedCategoryId,
  setSelectedCategoryId,
  editingConvenio,
  setEditingConvenio,
  savingConvenio,
  onSaveConvenio,
  onClearConvenio,
  t,
}: ConvenioSectionProps) {
  return (
    <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-6 mt-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-white">{t.convenios.assignTitle}</h2>
        </div>
        <RoleGate roles={['OWNER', 'ADMIN']}>
          {!editingConvenio && (
            <button
              onClick={() => setEditingConvenio(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg text-xs text-slate-300 transition-colors cursor-pointer"
            >
              <Pencil className="w-3 h-3" />
              {t.common.edit}
            </button>
          )}
        </RoleGate>
      </div>

      {editingConvenio ? (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-slate-400">{t.convenios.assignDesc}</p>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">{t.convenios.title}</label>
            <Select
              value={selectedConvenioId}
              onValueChange={(v) => {
                setSelectedConvenioId(v);
                setSelectedCategoryId('');
              }}
            >
              <SelectTrigger className={INPUT_CLASS}>
                <SelectValue placeholder={t.convenios.selectConvenio} />
              </SelectTrigger>
              <SelectContent className="bg-[#0F172A] border-white/[0.1] text-white">
                {convenios.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="focus:bg-white/[0.06] focus:text-white">
                    {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedConvenioId && (() => {
            const conv = convenios.find((c) => c.id === selectedConvenioId);
            const cats = conv?.categories ?? [];
            if (cats.length === 0) return null;
            return (
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1.5">{t.convenios.categories}</label>
                <Select
                  value={selectedCategoryId}
                  onValueChange={setSelectedCategoryId}
                >
                  <SelectTrigger className={INPUT_CLASS}>
                    <SelectValue placeholder={t.convenios.selectCategory} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0F172A] border-white/[0.1] text-white">
                    {cats.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="focus:bg-white/[0.06] focus:text-white">
                        {cat.name} ({cat.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })()}

          <div className="flex gap-2 justify-end">
            {employee?.convenioId && (
              <button
                onClick={onClearConvenio}
                disabled={savingConvenio}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {t.common.delete}
              </button>
            )}
            <button
              onClick={() => setEditingConvenio(false)}
              disabled={savingConvenio}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={onSaveConvenio}
              disabled={savingConvenio || !selectedConvenioId}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {savingConvenio ? t.common.saving : t.common.save}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DataRow
            label={t.convenios.title}
            value={employee?.convenioName ?? t.convenios.noConvenio}
          />
          <DataRow
            label={t.convenios.categories}
            value={employee?.convenioCategoryName ?? '\u2014'}
          />
        </div>
      )}
    </div>
  );
}
