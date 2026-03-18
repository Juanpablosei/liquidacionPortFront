'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, ChevronRight } from 'lucide-react';
import { useCompanyStore } from '@/stores/company-store';
import { useUiStore } from '@/stores/ui-store';
import { useTranslation } from '@/lib/i18n';
import { ROUTES } from '@/lib/constants/routes';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { LocaleToggle } from '@/components/layout/locale-toggle';

function buildBreadcrumbs(
  pathname:    string,
  companyName: string | undefined,
  companyId:   string | undefined,
  t:           ReturnType<typeof useTranslation>,
): { label: string; href?: string }[] {
  const crumbs: { label: string; href?: string }[] = [];

  if (!pathname.startsWith('/companies')) return crumbs;

  crumbs.push({ label: t.header.companies, href: ROUTES.companies });

  if (!companyId) return crumbs;

  crumbs.push({ label: companyName ?? companyId, href: companyId ? ROUTES.company(companyId) : undefined });

  const segments: Record<string, string> = {
    employees:  t.header.employees,
    attendance: t.header.attendance,
    overtime:   t.header.overtime,
    holidays:   t.header.holidays,
    concepts:   t.header.concepts,
    payroll:    t.header.payroll,
    members:    t.header.members,
    settings:   t.header.settings,
    new:        t.header.new,
  };

  const parts = pathname.split('/').filter(Boolean);
  const afterCompanyId = parts.slice(parts.indexOf(companyId) + 1);

  for (const part of afterCompanyId) {
    if (segments[part]) {
      crumbs.push({ label: segments[part] });
    } else if (part !== 'new' && part.length > 10) {
      crumbs.push({ label: '...' });
    }
  }

  return crumbs;
}

export function Header() {
  const pathname = usePathname();
  const { activeCompany } = useCompanyStore();
  const { openMobileSidebar } = useUiStore();
  const t = useTranslation();

  const crumbs = buildBreadcrumbs(pathname, activeCompany?.name, activeCompany?.id, t);

  return (
    <header className="h-14 border-b border-border bg-background flex items-center px-5 gap-4 shrink-0">
      <button
        onClick={openMobileSidebar}
        aria-label={t.header.openMenu}
        className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-overlay transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:hidden"
      >
        <Menu className="w-4 h-4" />
      </button>

      {crumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-sm min-w-0">
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
              {crumb.href && i < crumbs.length - 1 ? (
                <Link href={crumb.href} className="text-muted-foreground hover:text-muted-foreground transition-colors duration-150 truncate">
                  {crumb.label}
                </Link>
              ) : (
                <span className={`truncate ${i === crumbs.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <LocaleToggle />
      </div>
    </header>
  );
}
