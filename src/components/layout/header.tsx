'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, ChevronRight } from 'lucide-react';
import { useCompanyStore } from '@/stores/company-store';
import { useUiStore } from '@/stores/ui-store';
import { ROUTES } from '@/lib/constants/routes';

function buildBreadcrumbs(
  pathname:    string,
  companyName: string | undefined,
  companyId:   string | undefined,
): { label: string; href?: string }[] {
  const crumbs: { label: string; href?: string }[] = [];

  if (!pathname.startsWith('/companies')) return crumbs;

  crumbs.push({ label: 'Empresas', href: ROUTES.companies });

  if (!companyId) return crumbs;

  crumbs.push({ label: companyName ?? companyId, href: companyId ? ROUTES.company(companyId) : undefined });

  const segments: Record<string, string> = {
    employees:  'Empleados',
    attendance: 'Asistencia',
    overtime:   'Horas extra',
    holidays:   'Feriados',
    concepts:   'Conceptos',
    payroll:    'Nómina',
    members:    'Miembros',
    settings:   'Configuración',
    new:        'Nuevo',
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

  const crumbs = buildBreadcrumbs(pathname, activeCompany?.name, activeCompany?.id);

  return (
    <header className="h-14 border-b border-white/[0.06] bg-[#0A0F1C] flex items-center px-5 gap-4 shrink-0">
      <button
        onClick={openMobileSidebar}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.05] transition-colors lg:hidden"
      >
        <Menu className="w-4 h-4" />
      </button>

      {crumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-sm min-w-0">
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />}
              {crumb.href && i < crumbs.length - 1 ? (
                <Link href={crumb.href} className="text-slate-500 hover:text-slate-300 transition-colors truncate">
                  {crumb.label}
                </Link>
              ) : (
                <span className={`truncate ${i === crumbs.length - 1 ? 'text-white font-medium' : 'text-slate-500'}`}>
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}
    </header>
  );
}
