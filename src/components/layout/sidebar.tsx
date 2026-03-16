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
  FileText,
  UserCog,
  Settings2,
  Building2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  Scale,
  Shield,
  CreditCard,
  ScrollText,
  ClipboardList,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useCompanyStore } from '@/stores/company-store';
import { useUiStore } from '@/stores/ui-store';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { useTranslation } from '@/lib/i18n';
import { ROUTES } from '@/lib/constants/routes';
import { hasMinRole, ROLE_HIERARCHY } from '@/lib/constants/roles';
import { CompanySwitcher } from './company-switcher';
import type { CompanyRole } from '@/lib/types/company';
import { logout as logoutApi } from '@/lib/api/auth';

interface NavItemDef {
  href:     string;
  icon:     React.ElementType;
  label:    string;
  exact?:   boolean;
  minRole?: CompanyRole;
  maxRole?: CompanyRole;
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
  if (item.maxRole && ROLE_HIERARCHY[role ?? 'MEMBER'] > ROLE_HIERARCHY[item.maxRole]) return null;

  const isActive = item.exact
    ? pathname === item.href
    : pathname.startsWith(item.href);

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-label={collapsed ? item.label : undefined}
      title={collapsed ? item.label : undefined}
      className={`
        flex items-center gap-3 rounded-xl transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B16]
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
  const t = useTranslation();

  const companyId = activeCompany?.id;
  const isSuperAdmin = user?.systemRole === 'SUPER_ADMIN' || user?.systemRole === 'SUPER_VIEWER';
  const isOnAdminRoute = pathname.startsWith('/admin');

  const adminPanelNav: NavItemDef[] = [
    { href: ROUTES.admin,              icon: LayoutDashboard, label: t.sidebar.adminDashboard, exact: true },
    { href: ROUTES.adminConvenios,     icon: Scale,           label: t.sidebar.adminConvenios },
    { href: ROUTES.adminPlans,         icon: CreditCard,      label: t.sidebar.adminPlans },
    { href: ROUTES.adminSubscriptions, icon: ScrollText,      label: t.sidebar.adminSubs },
    { href: ROUTES.adminCompanies,     icon: Building2,       label: t.sidebar.adminCompanies },
  ];

  const mainNav: NavItemDef[] = (isSuperAdmin && isOnAdminRoute) ? adminPanelNav : companyId ? [
    { href: ROUTES.company(companyId),    icon: LayoutDashboard, label: t.sidebar.dashboard,   exact: true },
    { href: ROUTES.employees(companyId),  icon: Users,           label: t.sidebar.employees,   minRole: 'MANAGER' },
    { href: ROUTES.attendance(companyId), icon: Clock,           label: t.sidebar.attendance,  minRole: 'MANAGER' },
    { href: ROUTES.overtime(companyId),   icon: Timer,           label: t.sidebar.overtime,    minRole: 'MANAGER' },
    { href: ROUTES.holidays(companyId),   icon: CalendarDays,    label: t.sidebar.holidays },
    { href: ROUTES.concepts(companyId),   icon: Tags,            label: t.sidebar.concepts,    minRole: 'MANAGER' },
    { href: ROUTES.payroll(companyId),    icon: Receipt,         label: t.sidebar.payroll,     minRole: 'MANAGER' },
    { href: ROUTES.payslips(companyId),  icon: FileText,        label: t.sidebar.payslips,    minRole: 'MANAGER' },
    { href: ROUTES.convenios(companyId), icon: Scale,           label: t.sidebar.convenios },
    { href: ROUTES.myPayslips(companyId), icon: FileText,        label: t.sidebar.myPayslips, maxRole: 'MEMBER' },
  ] : [
    { href: ROUTES.companies, icon: Building2, label: t.sidebar.myCompanies, exact: true },
  ];

  const adminNav: NavItemDef[] = (isSuperAdmin && isOnAdminRoute) ? [] : companyId ? [
    { href: ROUTES.auditLogs(companyId),       icon: ClipboardList, label: t.sidebar.auditLogs, minRole: 'ADMIN' },
    { href: ROUTES.companyMembers(companyId),  icon: UserCog,  label: t.sidebar.members,   minRole: 'ADMIN' },
    { href: ROUTES.companySettings(companyId), icon: Settings2, label: t.sidebar.settings, minRole: 'ADMIN' },
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

  const displayName = user?.name ?? user?.email ?? t.sidebar.user;
  const initials    = displayName
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  return (
    <aside
      className="flex flex-col h-screen bg-[#060B16] border-r border-white/[0.06] transition-[width] duration-200 ease-in-out shrink-0"
      style={{ width: sidebarCollapsed ? 64 : 240 }}
    >
      {/* Logo */}
      <div className={`flex items-center border-b border-white/[0.06] h-14 shrink-0 ${sidebarCollapsed ? 'justify-center px-0' : 'px-4 gap-2.5'}`}>
        <Link href={ROUTES.companies} aria-label="Silent Port — Home" className="flex items-center gap-2.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:rounded-lg focus-visible:outline-none">
          <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 3.5h10M2 7h6M2 10.5h8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          {!sidebarCollapsed && (
            <span className="text-[14px] font-semibold tracking-tight text-white">Silent Port</span>
          )}
        </Link>
      </div>

      {/* Company switcher or Admin badge */}
      <div className="pt-3 shrink-0">
        {isSuperAdmin && isOnAdminRoute ? (
          <div className={`px-3 mb-4 ${sidebarCollapsed ? 'px-2' : ''}`}>
            <Link
              href={ROUTES.admin}
              className={`flex items-center gap-2.5 rounded-xl transition-colors duration-150 ${sidebarCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-2.5 py-2'}`}
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-amber-400" />
              </div>
              {!sidebarCollapsed && (
                <span className="text-sm font-medium text-amber-400">{t.sidebar.adminPanel}</span>
              )}
            </Link>
          </div>
        ) : (
          <CompanySwitcher collapsed={sidebarCollapsed} />
        )}
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
          aria-label={sidebarCollapsed ? displayName : undefined}
          title={sidebarCollapsed ? displayName : undefined}
          className={`flex items-center gap-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B16] ${sidebarCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-3 py-2'}`}
        >
          <div className="w-7 h-7 rounded-full bg-[#2563EB]/20 flex items-center justify-center text-xs font-semibold text-[#93BBFC] shrink-0">
            {initials}
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate leading-none">{displayName}</p>
              {user?.email && (
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              )}
            </div>
          )}
        </Link>

        <button
          onClick={handleLogout}
          aria-label={sidebarCollapsed ? t.sidebar.logout : undefined}
          title={sidebarCollapsed ? t.sidebar.logout : undefined}
          className={`flex items-center gap-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B16] ${sidebarCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-3 py-2'}`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!sidebarCollapsed && <span className="text-sm">{t.sidebar.logoutShort}</span>}
        </button>

        <button
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? t.sidebar.expand : t.sidebar.collapse}
          className={`flex items-center gap-2.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B16] ${sidebarCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-3 py-2'}`}
          title={sidebarCollapsed ? t.sidebar.expandShort : t.sidebar.collapseShort}
        >
          {sidebarCollapsed
            ? <ChevronRight className="w-3.5 h-3.5" />
            : <><ChevronLeft className="w-3.5 h-3.5" /><span className="text-xs">{t.sidebar.collapseShort}</span></>
          }
        </button>
      </div>
    </aside>
  );
}

// ─── Mobile Sidebar Drawer ───────────────────────────────────────────────────

export function MobileSidebar({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuthStore();
  const { activeCompany, clearCompany } = useCompanyStore();
  const { role } = usePermissions();
  const t = useTranslation();

  const companyId = activeCompany?.id;

  const mainNav: NavItemDef[] = companyId ? [
    { href: ROUTES.company(companyId),    icon: LayoutDashboard, label: t.sidebar.dashboard,   exact: true },
    { href: ROUTES.employees(companyId),  icon: Users,           label: t.sidebar.employees,   minRole: 'MANAGER' },
    { href: ROUTES.attendance(companyId), icon: Clock,           label: t.sidebar.attendance,  minRole: 'MANAGER' },
    { href: ROUTES.overtime(companyId),   icon: Timer,           label: t.sidebar.overtime,    minRole: 'MANAGER' },
    { href: ROUTES.holidays(companyId),   icon: CalendarDays,    label: t.sidebar.holidays },
    { href: ROUTES.concepts(companyId),   icon: Tags,            label: t.sidebar.concepts,    minRole: 'MANAGER' },
    { href: ROUTES.payroll(companyId),    icon: Receipt,         label: t.sidebar.payroll,     minRole: 'MANAGER' },
    { href: ROUTES.payslips(companyId),  icon: FileText,        label: t.sidebar.payslips,    minRole: 'MANAGER' },
    { href: ROUTES.convenios(companyId), icon: Scale,           label: t.sidebar.convenios },
    { href: ROUTES.myPayslips(companyId), icon: FileText,        label: t.sidebar.myPayslips, maxRole: 'MEMBER' },
  ] : [
    { href: ROUTES.companies, icon: Building2, label: t.sidebar.myCompanies, exact: true },
  ];

  const adminNav: NavItemDef[] = companyId ? [
    { href: ROUTES.auditLogs(companyId),       icon: ClipboardList, label: t.sidebar.auditLogs, minRole: 'ADMIN' },
    { href: ROUTES.companyMembers(companyId),  icon: UserCog,   label: t.sidebar.members,   minRole: 'ADMIN' },
    { href: ROUTES.companySettings(companyId), icon: Settings2, label: t.sidebar.settings,  minRole: 'ADMIN' },
  ] : [];

  const displayName = user?.name ?? user?.email ?? t.sidebar.user;
  const initials    = displayName.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();

  async function handleLogout() {
    try { await logoutApi(); } catch { /* ignore */ }
    logout();
    clearCompany();
    onClose();
    router.push(ROUTES.login);
  }

  return (
    <aside className="flex flex-col h-screen w-[240px] bg-[#060B16] border-r border-white/[0.06]">
      {/* Logo + close */}
      <div className="flex items-center justify-between border-b border-white/[0.06] h-14 px-4 shrink-0">
        <Link href={ROUTES.companies} aria-label="Silent Port — Home" className="flex items-center gap-2.5 focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:rounded-lg focus-visible:outline-none" onClick={onClose}>
          <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 3.5h10M2 7h6M2 10.5h8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-[14px] font-semibold tracking-tight text-white">Silent Port</span>
        </Link>
        <button
          onClick={onClose}
          aria-label={t.sidebar.closeMenu}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B16]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Company switcher */}
      <div className="pt-3 shrink-0">
        <CompanySwitcher collapsed={false} />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 pb-2 flex flex-col gap-0.5">
        {mainNav.map((item) => (
          <div key={item.href} onClick={onClose}>
            <NavItem item={item} collapsed={false} pathname={pathname} role={role} />
          </div>
        ))}
        {adminNav.length > 0 && (
          <>
            <div className="my-2 border-t border-white/[0.06] mx-1" />
            {adminNav.map((item) => (
              <div key={item.href} onClick={onClose}>
                <NavItem item={item} collapsed={false} pathname={pathname} role={role} />
              </div>
            ))}
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/[0.06] p-2 shrink-0 flex flex-col gap-1">
        <Link
          href={ROUTES.profile}
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B16] focus-visible:outline-none"
        >
          <div className="w-7 h-7 rounded-full bg-[#2563EB]/20 flex items-center justify-center text-xs font-semibold text-[#93BBFC] shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate leading-none">{displayName}</p>
            {user?.email && <p className="text-xs text-slate-400 truncate">{user.email}</p>}
          </div>
        </Link>
        <button
          onClick={handleLogout}
          aria-label={t.sidebar.logout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B16] focus-visible:outline-none"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="text-sm">{t.sidebar.logoutShort}</span>
        </button>
      </div>
    </aside>
  );
}
