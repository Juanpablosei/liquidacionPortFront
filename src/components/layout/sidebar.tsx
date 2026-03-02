'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Clock,
  Timer,
  CalendarDays,
  Tags,
  Receipt,
  UserCog,
  Settings2,
  Building2,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useCompanyStore } from '@/stores/company-store';
import { useUiStore } from '@/stores/ui-store';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { ROUTES } from '@/lib/constants/routes';
import { hasMinRole } from '@/lib/constants/roles';
import { CompanySwitcher } from './company-switcher';
import type { CompanyRole } from '@/lib/types/company';
import { logout as logoutApi } from '@/lib/api/auth';
import { toast } from 'sonner';

interface NavItemDef {
  href:     string;
  icon:     React.ElementType;
  label:    string;
  exact?:   boolean;
  minRole?: CompanyRole;
}

function NavItem({
  item,
  collapsed,
  pathname,
  role,
}: {
  item:      NavItemDef;
  collapsed: boolean;
  pathname:  string;
  role:      CompanyRole | null;
}) {
  if (item.minRole && !hasMinRole(role ?? 'MEMBER', item.minRole)) return null;

  const isActive = item.exact
    ? pathname === item.href
    : pathname.startsWith(item.href);

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={`
        flex items-center gap-3 rounded-xl transition-colors
        ${collapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-3 py-2'}
        ${isActive
          ? 'bg-[#2563EB]/15 text-[#93BBFC]'
          : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
        }
      `}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
    </Link>
  );
}

export function Sidebar() {
  const pathname    = usePathname();
  const router      = useRouter();
  const { user, logout } = useAuthStore();
  const { activeCompany, clearCompany } = useCompanyStore();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const { role } = usePermissions();

  const companyId = activeCompany?.id;

  const mainNav: NavItemDef[] = companyId ? [
    { href: ROUTES.company(companyId),    icon: LayoutDashboard, label: 'Dashboard',   exact: true },
    { href: ROUTES.employees(companyId),  icon: Users,           label: 'Empleados',   minRole: 'MANAGER' },
    { href: ROUTES.attendance(companyId), icon: Clock,           label: 'Asistencia',  minRole: 'MANAGER' },
    { href: ROUTES.overtime(companyId),   icon: Timer,           label: 'Horas extra', minRole: 'MANAGER' },
    { href: ROUTES.holidays(companyId),   icon: CalendarDays,    label: 'Feriados' },
    { href: ROUTES.concepts(companyId),   icon: Tags,            label: 'Conceptos',   minRole: 'MANAGER' },
    { href: ROUTES.payroll(companyId),    icon: Receipt,         label: 'Nómina',      minRole: 'MANAGER' },
  ] : [
    { href: ROUTES.companies, icon: Building2, label: 'Mis empresas', exact: true },
  ];

  const adminNav: NavItemDef[] = companyId ? [
    { href: ROUTES.companyMembers(companyId),  icon: UserCog,  label: 'Miembros',       minRole: 'ADMIN' },
    { href: ROUTES.companySettings(companyId), icon: Settings2, label: 'Configuración', minRole: 'ADMIN' },
  ] : [];

  async function handleLogout() {
    try {
      await logoutApi();
    } catch {
      // ignore
    }
    logout();
    clearCompany();
    router.push(ROUTES.login);
  }

  const displayName = user?.name ?? user?.email ?? 'Usuario';
  const initials    = displayName
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  return (
    <aside
      className="flex flex-col h-screen bg-[#060B16] border-r border-white/[0.06] transition-all duration-200 ease-in-out shrink-0"
      style={{ width: sidebarCollapsed ? 64 : 240 }}
    >
      {/* Logo */}
      <div className={`flex items-center border-b border-white/[0.06] h-14 shrink-0 ${sidebarCollapsed ? 'justify-center px-0' : 'px-4 gap-2.5'}`}>
        <Link href={ROUTES.companies} className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 3.5h10M2 7h6M2 10.5h8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          {!sidebarCollapsed && (
            <span className="text-[14px] font-semibold tracking-tight text-white">Silent Port</span>
          )}
        </Link>
      </div>

      {/* Company switcher */}
      <div className="pt-3 shrink-0">
        <CompanySwitcher collapsed={sidebarCollapsed} />
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-2 pb-2 flex flex-col gap-0.5">
        {mainNav.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            collapsed={sidebarCollapsed}
            pathname={pathname}
            role={role}
          />
        ))}

        {adminNav.length > 0 && (
          <>
            <div className={`my-2 border-t border-white/[0.06] ${sidebarCollapsed ? 'mx-2' : 'mx-1'}`} />
            {adminNav.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                collapsed={sidebarCollapsed}
                pathname={pathname}
                role={role}
              />
            ))}
          </>
        )}
      </nav>

      {/* Bottom: profile + collapse */}
      <div className="border-t border-white/[0.06] p-2 shrink-0 flex flex-col gap-1">
        <Link
          href={ROUTES.profile}
          title={sidebarCollapsed ? displayName : undefined}
          className={`flex items-center gap-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors ${sidebarCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-3 py-2'}`}
        >
          <div className="w-7 h-7 rounded-full bg-[#2563EB]/20 flex items-center justify-center text-xs font-semibold text-[#93BBFC] shrink-0">
            {initials}
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate leading-none">{displayName}</p>
              {user?.email && (
                <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
              )}
            </div>
          )}
        </Link>

        <button
          onClick={handleLogout}
          title={sidebarCollapsed ? 'Cerrar sesión' : undefined}
          className={`flex items-center gap-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors ${sidebarCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-3 py-2'}`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!sidebarCollapsed && <span className="text-sm">Salir</span>}
        </button>

        <button
          onClick={toggleSidebar}
          className={`flex items-center gap-2.5 rounded-xl text-slate-600 hover:text-slate-400 hover:bg-white/[0.03] transition-colors ${sidebarCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-3 py-2'}`}
          title={sidebarCollapsed ? 'Expandir' : 'Colapsar'}
        >
          {sidebarCollapsed
            ? <ChevronRight className="w-3.5 h-3.5" />
            : <><ChevronLeft className="w-3.5 h-3.5" /><span className="text-xs">Colapsar</span></>
          }
        </button>
      </div>
    </aside>
  );
}
