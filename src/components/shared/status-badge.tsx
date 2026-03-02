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

const VARIANT_CONFIG: Record<StatusBadgeVariant, { label: string; className: string }> = {
  DRAFT:      { label: 'Borrador',    className: 'bg-slate-500/15 text-slate-400 border-slate-500/20' },
  RUNNING:    { label: 'Procesando',  className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  COMPLETED:  { label: 'Completado',  className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  CLOSED:     { label: 'Cerrado',     className: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  active:     { label: 'Activo',      className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  inactive:   { label: 'Inactivo',    className: 'bg-red-500/15 text-red-400 border-red-500/20' },
  EARNING:    { label: 'Haber',       className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  DEDUCTION:  { label: 'Deducción',   className: 'bg-red-500/15 text-red-400 border-red-500/20' },
  OT_50:      { label: 'OT 50%',      className: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
  OT_100:     { label: 'OT 100%',     className: 'bg-red-500/15 text-red-400 border-red-500/20' },
  OWNER:      { label: 'Propietario', className: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
  ADMIN:      { label: 'Admin',       className: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  MANAGER:    { label: 'Manager',     className: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20' },
  MEMBER:     { label: 'Miembro',     className: 'bg-slate-500/15 text-slate-400 border-slate-500/20' },
  MONTHLY:    { label: 'Mensual',     className: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  HOURLY:     { label: 'Por hora',    className: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20' },
};

export function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  const config = VARIANT_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${config.className} ${className}`}>
      {label ?? config.label}
    </span>
  );
}
