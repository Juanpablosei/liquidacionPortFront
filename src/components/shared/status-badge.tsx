'use client';

import { useTranslation } from '@/lib/i18n';

type StatusBadgeVariant =
  | 'DRAFT'
  | 'RUNNING'
  | 'COMPLETED'
  | 'CLOSED'
  | 'active'
  | 'inactive'
  | 'EARNING'
  | 'DEDUCTION'
  | 'OT_50'
  | 'OT_100'
  | 'OWNER'
  | 'ADMIN'
  | 'MANAGER'
  | 'MEMBER'
  | 'MONTHLY'
  | 'HOURLY';

interface StatusBadgeProps {
  status:   StatusBadgeVariant;
  label?:   string;
  className?: string;
}

const VARIANT_STYLES: Record<StatusBadgeVariant, string> = {
  DRAFT:     'bg-slate-500/15 text-muted-foreground border-slate-500/20',
  RUNNING:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  CLOSED:    'bg-blue-500/15 text-blue-400 border-blue-500/20',
  active:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  inactive:  'bg-red-500/15 text-red-400 border-red-500/20',
  EARNING:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  DEDUCTION: 'bg-red-500/15 text-red-400 border-red-500/20',
  OT_50:     'bg-orange-500/15 text-orange-400 border-orange-500/20',
  OT_100:    'bg-red-500/15 text-red-400 border-red-500/20',
  OWNER:     'bg-violet-500/15 text-violet-400 border-violet-500/20',
  ADMIN:     'bg-blue-500/15 text-blue-400 border-blue-500/20',
  MANAGER:   'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  MEMBER:    'bg-slate-500/15 text-muted-foreground border-slate-500/20',
  MONTHLY:   'bg-blue-500/15 text-blue-400 border-blue-500/20',
  HOURLY:    'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
};

const VARIANT_KEY: Record<StatusBadgeVariant, keyof ReturnType<typeof useTranslation>['status']> = {
  DRAFT:     'draft',
  RUNNING:   'running',
  COMPLETED: 'completed',
  CLOSED:    'closed',
  active:    'active',
  inactive:  'inactive',
  EARNING:   'earning',
  DEDUCTION: 'deduction',
  OT_50:     'ot50',
  OT_100:    'ot100',
  OWNER:     'owner',
  ADMIN:     'admin',
  MANAGER:   'manager',
  MEMBER:    'member',
  MONTHLY:   'monthly',
  HOURLY:    'hourly',
};

export function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  const t = useTranslation();
  const style = VARIANT_STYLES[status];
  const defaultLabel = t.status[VARIANT_KEY[status]];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${style} ${className}`}>
      {label ?? defaultLabel}
    </span>
  );
}
