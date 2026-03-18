'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface PageHeaderProps {
  title:        string;
  description?: string;
  actions?:     React.ReactNode;
  backHref?:    string;
}

export function PageHeader({ title, description, actions, backHref }: PageHeaderProps) {
  const t = useTranslation();

  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div className="flex items-start gap-3">
        {backHref && (
          <Link
            href={backHref}
            aria-label={t.pageHeader.back}
            className="mt-0.5 w-11 h-11 rounded-lg bg-overlay-subtle border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-overlay-strong transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
        )}
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
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
