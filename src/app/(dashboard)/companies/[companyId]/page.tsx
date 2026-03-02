'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Users,
  Clock,
  Receipt,
  Timer,
  CalendarDays,
  Tags,
  UserCog,
  Settings2,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useCompanyStore } from '@/stores/company-store';
import { getCompany, listMembers } from '@/lib/api/companies';
import { ROUTES } from '@/lib/constants/routes';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { usePermissions } from '@/lib/hooks/use-permissions';
import type { Company, CompanyUser } from '@/lib/types/company';

export default function CompanyDashboardPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { user } = useAuthStore();
  const { setActiveCompany, activeCompany } = useCompanyStore();
  const { role } = usePermissions();

  const [company,  setCompany]  = useState<Company | null>(null);
  const [members,  setMembers]  = useState<CompanyUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    setIsLoading(true);
    Promise.all([
      getCompany(companyId),
      listMembers(companyId),
    ])
      .then(([co, mems]) => {
        setCompany(co);
        const list = Array.isArray(mems) ? mems : [];
        setMembers(list);
        const membership = list.find((m) => m.userId === user?.id);
        if (membership) {
          setActiveCompany(co, membership);
        }
      })
      .catch((err: Error) => {
        toast.error(err.message ?? 'No se pudo cargar la empresa');
      })
      .finally(() => setIsLoading(false));
  }, [companyId, user?.id, setActiveCompany]);

  if (isLoading) return <DashboardSkeleton />;
  if (!company) return null;

  return (
    <>
      <PageHeader
        title={company.name}
        description={[company.taxId && `CUIT ${company.taxId}`, company.address].filter(Boolean).join(' — ') || undefined}
        actions={
          <StatusBadge status={company.isActive ? 'active' : 'inactive'} />
        }
        backHref={ROUTES.companies}
      />

      {/* KPI stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Miembros"
          value={members.length}
          icon={<Users className="w-4 h-4" />}
          description={role ? `Tu rol: ${role.toLowerCase()}` : undefined}
          href={ROUTES.companyMembers(companyId)}
        />
        <StatCard
          title="Empleados activos"
          value="—"
          icon={<UserCog className="w-4 h-4" />}
          description="Próximamente disponible"
          href={ROUTES.employees(companyId)}
        />
        <StatCard
          title="Último run"
          value="—"
          icon={<Receipt className="w-4 h-4" />}
          description="Próximamente disponible"
          href={ROUTES.payroll(companyId)}
        />
        <StatCard
          title="Desde"
          value={new Date(company.createdAt).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })}
          icon={<CalendarDays className="w-4 h-4" />}
        />
      </div>

      {/* Quick access */}
      <div className="mb-2">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-4">
          Acceso rápido
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {QUICK_LINKS(companyId, role).map((link) => (
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

function QUICK_LINKS(cid: string, role: string | null) {
  const links = [
    {
      href:        ROUTES.employees(cid),
      icon:        <Users className="w-4 h-4" />,
      label:       'Empleados',
      description: 'Gestión de personal y contratos',
      minRole:     'MANAGER',
    },
    {
      href:        ROUTES.attendance(cid),
      icon:        <Clock className="w-4 h-4" />,
      label:       'Asistencia',
      description: 'Registro de entradas y salidas',
      minRole:     'MANAGER',
    },
    {
      href:        ROUTES.overtime(cid),
      icon:        <Timer className="w-4 h-4" />,
      label:       'Horas extra',
      description: 'OT 50% y OT 100%',
      minRole:     'MANAGER',
    },
    {
      href:        ROUTES.holidays(cid),
      icon:        <CalendarDays className="w-4 h-4" />,
      label:       'Feriados',
      description: 'Obligatorios y optativos',
    },
    {
      href:        ROUTES.concepts(cid),
      icon:        <Tags className="w-4 h-4" />,
      label:       'Conceptos',
      description: 'Haberes y deducciones',
      minRole:     'MANAGER',
    },
    {
      href:        ROUTES.payroll(cid),
      icon:        <Receipt className="w-4 h-4" />,
      label:       'Nómina',
      description: 'Períodos, runs y payslips',
      minRole:     'MANAGER',
    },
    {
      href:        ROUTES.companyMembers(cid),
      icon:        <UserCog className="w-4 h-4" />,
      label:       'Miembros',
      description: 'Roles y permisos del equipo',
      minRole:     'ADMIN',
    },
    {
      href:        ROUTES.companySettings(cid),
      icon:        <Settings2 className="w-4 h-4" />,
      label:       'Configuración',
      description: 'Datos y ajustes de empresa',
      minRole:     'ADMIN',
    },
  ];

  const ROLE_HIERARCHY: Record<string, number> = {
    OWNER: 4, ADMIN: 3, MANAGER: 2, MEMBER: 1,
  };
  const userLevel = ROLE_HIERARCHY[role ?? 'MEMBER'] ?? 1;

  return links.filter((l) => {
    if (!l.minRole) return true;
    return userLevel >= (ROLE_HIERARCHY[l.minRole] ?? 1);
  });
}

function DashboardSkeleton() {
  return (
    <>
      <div className="flex items-start gap-4 mb-8">
        <div className="flex-1">
          <div className="h-6 bg-white/[0.06] rounded w-48 mb-2 animate-pulse" />
          <div className="h-4 bg-white/[0.04] rounded w-72 animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-white/[0.06] rounded w-24 mb-4" />
            <div className="h-7 bg-white/[0.08] rounded w-16" />
          </div>
        ))}
      </div>
    </>
  );
}
