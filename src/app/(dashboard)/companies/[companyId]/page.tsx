'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from '@/lib/utils/toast';
import {
  Users,
  Clock,
  Receipt,
  Timer,
  CalendarDays,
  Tags,
  UserCog,
  Settings2,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { useCompanyStore } from '@/stores/company-store';
import { getCompany, listMembers } from '@/lib/api/companies';
import { listEmployees } from '@/lib/api/employees';
import { listRuns, listPeriods } from '@/lib/api/payroll';
import { ROUTES } from '@/lib/constants/routes';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { useTranslation, useLocaleId } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/es';
import type { Company, CompanyUser } from '@/lib/types/company';
import type { PayrollRun, PayrollPeriod } from '@/lib/types/payroll';

function formatPeriodRange(start: string, end: string, locale: string): string {
  const fmt = (d: string) => {
    const iso = d.includes('T') ? d : d + 'T00:00:00';
    return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short' });
  };
  return `${fmt(start)} → ${fmt(end)}`;
}

export default function CompanyDashboardPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { setActiveCompany } = useCompanyStore();
  const { role } = usePermissions();
  const isMember = role === 'MEMBER';
  const t = useTranslation();
  const localeId = useLocaleId();

  const RUN_STATUS_LABELS: Record<string, string> = {
    DRAFT:     t.companies.overview.statusDraft,
    RUNNING:   t.companies.overview.statusCalc,
    COMPLETED: t.companies.overview.statusCalced,
    CLOSED:    t.companies.overview.statusClosed,
  };

  const [company,       setCompany]       = useState<Company | null>(null);
  const [members,       setMembers]       = useState<CompanyUser[]>([]);
  const [activeEmpCount, setActiveEmpCount] = useState<number | null>(null);
  const [lastRun,       setLastRun]       = useState<PayrollRun | null>(null);
  const [lastRunPeriod, setLastRunPeriod] = useState<PayrollPeriod | null>(null);
  const [isLoading,     setIsLoading]     = useState(true);

  useEffect(() => {
    if (!companyId) return;

    setIsLoading(true);
    getCompany(companyId)
      .then(async (co) => {
        setCompany(co);
        if (co.myRole) setActiveCompany(co, co.myRole);
        const [mems, empRes, runs, periods] = await Promise.all([
          listMembers(companyId).catch(() => []),
          listEmployees(companyId, { limit: 1, isActive: true }).catch(() => null),
          listRuns(companyId).catch(() => []),
          listPeriods(companyId).catch(() => []),
        ]);
        setMembers(Array.isArray(mems) ? mems : []);
        if (empRes) setActiveEmpCount(empRes.total);
        if (runs.length > 0) {
          const sorted = [...runs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setLastRun(sorted[0]);
          const period = periods.find((p) => p.id === sorted[0].periodId);
          if (period) setLastRunPeriod(period);
        }
      })
      .catch((err: Error) => {
        toast.error(err.message ?? t.companies.overview.loadError);
      })
      .finally(() => setIsLoading(false));
  }, [companyId, setActiveCompany]);

  if (isLoading) return <DashboardSkeleton />;
  if (!company) return null;

  return (
    <>
      <PageHeader
        title={company.name}
        description={[company.taxId && `${t.companies.cuit} ${company.taxId}`, company.address].filter(Boolean).join(' — ') || undefined}
        actions={
          <StatusBadge status={company.isActive ? 'active' : 'inactive'} />
        }
        backHref={ROUTES.companies}
      />

      {/* KPI stats */}
      <div className={`grid grid-cols-2 ${isMember ? '' : 'lg:grid-cols-4'} gap-4 mb-8`}>
        {!isMember && (
          <>
            <StatCard
              title={t.companies.overview.members}
              value={members.length}
              icon={<Users className="w-4 h-4" />}
              description={role ? `${t.companies.overview.yourRole} ${role.toLowerCase()}` : undefined}
              href={ROUTES.companyMembers(companyId)}
            />
            <StatCard
              title={t.companies.overview.activeEmployees}
              value={activeEmpCount ?? '—'}
              icon={<UserCog className="w-4 h-4" />}
              href={ROUTES.employees(companyId)}
            />
            <StatCard
              title={t.companies.overview.lastRun}
              value={lastRun ? RUN_STATUS_LABELS[lastRun.status] : t.companies.overview.noRuns}
              icon={<Receipt className="w-4 h-4" />}
              description={lastRunPeriod?.name ?? (lastRunPeriod ? formatPeriodRange(lastRunPeriod.startDate, lastRunPeriod.endDate, localeId) : undefined)}
              href={ROUTES.payroll(companyId)}
            />
          </>
        )}
        {isMember && (
          <StatCard
            title={t.companies.overview.yourRole}
            value={role?.toLowerCase() ?? 'member'}
            icon={<Users className="w-4 h-4" />}
          />
        )}
        <StatCard
          title={t.companies.overview.since}
          value={new Date(company.createdAt).toLocaleDateString(localeId, { month: 'short', year: 'numeric' })}
          icon={<CalendarDays className="w-4 h-4" />}
        />
      </div>

      {/* Quick access */}
      <div className="mb-2">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-4">
          {t.companies.overview.quickAccess}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {QUICK_LINKS(companyId, role, t).map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-3 hover:border-white/[0.1] hover:bg-[#131c2e] transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB] group-hover:bg-[#2563EB]/20 transition-colors">
              {link.icon}
            </div>
            <div className="flex items-end justify-between">
              <span className="text-sm font-medium text-white">{link.label}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all" />
            </div>
            {link.description && (
              <p className="text-xs text-slate-500 leading-relaxed -mt-1">{link.description}</p>
            )}
          </Link>
        ))}
      </div>
    </>
  );
}

function QUICK_LINKS(cid: string, role: string | null, t: Translations) {
  const links: {
    href: string;
    icon: React.ReactNode;
    label: string;
    description?: string;
    minRole?: string;
    maxRole?: string;
  }[] = [
    {
      href:        ROUTES.employees(cid),
      icon:        <Users className="w-4 h-4" />,
      label:       t.companies.overview.employees,
      description: t.companies.overview.employeesDesc,
      minRole:     'MANAGER',
    },
    {
      href:        ROUTES.attendance(cid),
      icon:        <Clock className="w-4 h-4" />,
      label:       t.companies.overview.attendance,
      description: t.companies.overview.attendanceDesc,
      minRole:     'MANAGER',
    },
    {
      href:        ROUTES.overtime(cid),
      icon:        <Timer className="w-4 h-4" />,
      label:       t.companies.overview.overtime,
      description: t.companies.overview.overtimeDesc,
      minRole:     'MANAGER',
    },
    {
      href:        ROUTES.holidays(cid),
      icon:        <CalendarDays className="w-4 h-4" />,
      label:       t.companies.overview.holidays,
      description: t.companies.overview.holidaysDesc,
    },
    {
      href:        ROUTES.concepts(cid),
      icon:        <Tags className="w-4 h-4" />,
      label:       t.companies.overview.concepts,
      description: t.companies.overview.conceptsDesc,
      minRole:     'MANAGER',
    },
    {
      href:        ROUTES.payroll(cid),
      icon:        <Receipt className="w-4 h-4" />,
      label:       t.companies.overview.payroll,
      description: t.companies.overview.payrollDesc,
      minRole:     'MANAGER',
    },
    {
      href:        ROUTES.myPayslips(cid),
      icon:        <FileText className="w-4 h-4" />,
      label:       t.companies.overview.myPayslips,
      description: t.companies.overview.myPayslipsDesc,
      maxRole:     'MEMBER',
    },
    {
      href:        ROUTES.companyMembers(cid),
      icon:        <UserCog className="w-4 h-4" />,
      label:       t.companies.overview.members2,
      description: t.companies.overview.membersDesc,
      minRole:     'ADMIN',
    },
    {
      href:        ROUTES.companySettings(cid),
      icon:        <Settings2 className="w-4 h-4" />,
      label:       t.companies.overview.settings,
      description: t.companies.overview.settingsDesc,
      minRole:     'ADMIN',
    },
    {
      href:        ROUTES.profile,
      icon:        <UserCog className="w-4 h-4" />,
      label:       t.companies.overview.profile,
      description: t.companies.overview.profileDesc,
      maxRole:     'MEMBER',
    },
  ];

  const ROLE_HIERARCHY: Record<string, number> = {
    OWNER: 4, ADMIN: 3, MANAGER: 2, MEMBER: 1,
  };
  const userLevel = ROLE_HIERARCHY[role ?? 'MEMBER'] ?? 1;

  return links.filter((l) => {
    if (l.minRole && userLevel < (ROLE_HIERARCHY[l.minRole] ?? 1)) return false;
    if (l.maxRole && userLevel > (ROLE_HIERARCHY[l.maxRole] ?? 1)) return false;
    return true;
  });
}

function DashboardSkeleton() {
  return (
    <>
      <div className="flex items-start gap-4 mb-8">
        <div className="flex-1">
          <div className="h-6 bg-white/[0.06] rounded w-48 mb-2 motion-safe:animate-pulse" />
          <div className="h-4 bg-white/[0.04] rounded w-72 motion-safe:animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-6 motion-safe:animate-pulse">
            <div className="h-4 bg-white/[0.06] rounded w-24 mb-4" />
            <div className="h-7 bg-white/[0.08] rounded w-16" />
          </div>
        ))}
      </div>
    </>
  );
}
