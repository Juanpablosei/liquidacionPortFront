'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, ChevronRight, Globe } from 'lucide-react';
import { useCompanyStore } from '@/stores/company-store';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';
import { useTranslation } from '@/lib/i18n';
import { updateLocale } from '@/lib/api/auth';
import { ROUTES } from '@/lib/constants/routes';

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
  const { user } = useAuthStore();
  const { openMobileSidebar } = useUiStore();
  const t = useTranslation();

  const crumbs = buildBreadcrumbs(pathname, activeCompany?.name, activeCompany?.id, t);
  const currentLocale = user?.locale ?? 'es';

  async function toggleLocale() {
    const next = currentLocale === 'es' ? 'en' : 'es';
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      useAuthStore.getState().setUser({ ...currentUser, locale: next });
    }
    try {
      await updateLocale(next);
    } catch {
      if (currentUser) {
        useAuthStore.getState().setUser({ ...currentUser, locale: currentLocale });
      }
    }
  }

  return (
    <header className="h-14 border-b border-white/[0.06] bg-[#0A0F1C] flex items-center px-5 gap-4 shrink-0">
      <button
        onClick={openMobileSidebar}
        aria-label={t.header.openMenu}
        className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1C] lg:hidden"
      >
        <Menu className="w-4 h-4" />
      </button>

      {crumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-sm min-w-0">
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />}
              {crumb.href && i < crumbs.length - 1 ? (
                <Link href={crumb.href} className="text-slate-400 hover:text-slate-300 transition-colors duration-150 truncate">
                  {crumb.label}
                </Link>
              ) : (
                <span className={`truncate ${i === crumbs.length - 1 ? 'text-white font-medium' : 'text-slate-400'}`}>
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="ml-auto">
        <button
          onClick={toggleLocale}
          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:outline-none"
          aria-label={t.header.changeLang}
        >
          <Globe className="w-3.5 h-3.5" />
          {currentLocale.toUpperCase()}
        </button>
      </div>
    </header>
  );
}
