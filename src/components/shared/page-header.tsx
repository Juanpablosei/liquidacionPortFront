import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface PageHeaderProps {
  title:        string;
  description?: string;
  actions?:     React.ReactNode;
  backHref?:    string;
}

export function PageHeader({ title, description, actions, backHref }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div className="flex items-start gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="mt-0.5 w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.07] transition-colors shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
        )}
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-slate-400 mt-1">{description}</p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
