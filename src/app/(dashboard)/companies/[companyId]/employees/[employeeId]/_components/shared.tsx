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

export const INPUT_CLASS = 'bg-overlay border-border text-foreground placeholder:text-muted-foreground focus:border-brand/50 focus:ring-0';

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
      <dt className="text-xs text-muted-foreground mb-0.5">{label}</dt>
      <dd className={`text-sm font-medium ${highlight === 'danger' ? 'text-red-400' : 'text-foreground'}`}>
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
      <DialogContent className="bg-card border border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">{t.employees.detail.terminateTitle}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
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
              className="bg-overlay border-border text-foreground [color-scheme:dark] focus:border-red-500/50 focus:ring-0"
            />
          </FormField>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground bg-overlay-subtle hover:bg-overlay-strong border border-border transition-colors disabled:opacity-50"
          >
            {t.common.cancel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-foreground bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
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
          <div className="w-8 h-8 rounded-lg bg-overlay" />
          <div>
            <div className="h-5 bg-overlay rounded w-48 mb-2" />
            <div className="h-3 bg-overlay-subtle rounded w-32" />
          </div>
        </div>
        <div className="h-8 w-24 bg-overlay rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-overlay-subtle rounded-xl p-5 h-64" />
        <div className="lg:col-span-2 bg-overlay-subtle rounded-xl p-5 h-64" />
      </div>
    </div>
  );
}
