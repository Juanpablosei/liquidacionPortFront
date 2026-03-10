'use client';

import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/form-field';
import type { TerminateEmployeeInput } from '@/lib/validators/employee';
import type { Translations } from '@/lib/i18n/es';

export const INPUT_CLASS = 'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 focus:border-[#2563EB]/50 focus:ring-0';

export const DOC_TYPE_KEYS = ['CI', 'RUC', 'PASSPORT', 'OTHER'] as const;

export function formatDate(dateStr: string | null, locale: string): string {
  if (!dateStr) return '\u2014';
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function DataRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: 'danger';
}) {
  return (
    <div>
      <dt className="text-xs text-slate-500 mb-0.5">{label}</dt>
      <dd className={`text-sm font-medium ${highlight === 'danger' ? 'text-red-400' : 'text-white'}`}>
        {value}
      </dd>
    </div>
  );
}

export function TerminateModal({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  form,
  t,
}: {
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  onConfirm:     () => void;
  isLoading:     boolean;
  form:          ReturnType<typeof useForm<TerminateEmployeeInput>>;
  t:             Translations;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0F172A] border border-white/[0.08] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">{t.employees.detail.terminateTitle}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {t.employees.detail.terminateModalDesc}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <FormField
            label={t.employees.detail.terminateDate}
            name="terminationDate"
            error={form.formState.errors.terminationDate?.message}
            required
          >
            <Input
              {...form.register('terminationDate')}
              type="date"
              className="bg-white/[0.05] border-white/[0.1] text-white [color-scheme:dark] focus:border-red-500/50 focus:ring-0"
            />
          </FormField>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors disabled:opacity-50"
          >
            {t.common.cancel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? t.common.processing : t.employees.detail.terminate}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EmployeeSkeleton() {
  return (
    <div className="flex flex-col gap-6 motion-safe:animate-pulse">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/[0.06]" />
          <div>
            <div className="h-5 bg-white/[0.06] rounded w-48 mb-2" />
            <div className="h-3 bg-white/[0.04] rounded w-32" />
          </div>
        </div>
        <div className="h-8 w-24 bg-white/[0.06] rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white/[0.03] rounded-xl p-5 h-64" />
        <div className="lg:col-span-2 bg-white/[0.03] rounded-xl p-5 h-64" />
      </div>
    </div>
  );
}
