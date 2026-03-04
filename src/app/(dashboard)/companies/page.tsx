'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Plus, ArrowRight } from 'lucide-react';
import { useCompanyStore } from '@/stores/company-store';
import { useAuthStore } from '@/stores/auth-store';
import { listCompanies } from '@/lib/api/companies';
import { ROUTES } from '@/lib/constants/routes';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import type { Company, CompanyRole } from '@/lib/types/company';

export default function CompaniesPage() {
  const { companies, setCompanies, clearCompany } = useCompanyStore();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const companyList = Array.isArray(companies) ? companies : [];

  useEffect(() => {
    clearCompany();
    if (authLoading || !isAuthenticated) return;
    listCompanies()
      .then((data) => {
        setCompanies(data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [authLoading, isAuthenticated, setCompanies, clearCompany]);

  return (
    <>
      <PageHeader
        title="Mis empresas"
        description="Seleccioná una empresa para administrarla o creá una nueva."
        actions={
          <Link
            href={ROUTES.newCompany}
            className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva empresa
          </Link>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-6 animate-pulse"
            >
              <div className="flex items-start gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-white/[0.06]" />
                <div className="flex-1">
                  <div className="h-4 bg-white/[0.06] rounded w-3/4 mb-2" />
                  <div className="h-3 bg-white/[0.04] rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-white/[0.04] rounded w-full mb-2" />
              <div className="h-3 bg-white/[0.04] rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : companyList.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-6 h-6" />}
          title="Todavía no tenés empresas"
          description="Creá tu primera empresa para empezar a gestionar tu nómina."
          action={
            <Link
              href={ROUTES.newCompany}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Crear mi primera empresa
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companyList.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}

          <Link
            href={ROUTES.newCompany}
            className="bg-[#0F172A] border border-dashed border-white/[0.08] rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:border-[#2563EB]/30 hover:bg-[#0F172A]/80 transition-all group min-h-[160px]"
          >
            <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB] group-hover:bg-[#2563EB]/20 transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
              Agregar empresa
            </span>
          </Link>
        </div>
      )}
    </>
  );
}

const ROLE_STYLES: Record<CompanyRole, string> = {
  OWNER:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ADMIN:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  MANAGER: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  MEMBER:  'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

function getInitials(name: string | undefined): string {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function CompanyCard({ company }: { company: Company }) {
  return (
    <Link
      href={ROUTES.company(company.id)}
      className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-6 hover:border-white/[0.1] hover:bg-[#131c2e] transition-all group"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#2563EB]/15 border border-[#2563EB]/20 flex items-center justify-center text-sm font-semibold text-[#93BBFC] shrink-0">
          {getInitials(company.name)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate group-hover:text-slate-100 transition-colors">
            {company.name}
          </h3>
          {company.taxId && (
            <p className="text-xs text-slate-500 mt-0.5">CUIT {company.taxId}</p>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
      </div>

      {company.address && (
        <p className="text-xs text-slate-500 truncate mb-3">{company.address}</p>
      )}

      <div className="flex items-center gap-2">
        <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${company.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
          {company.isActive ? 'Activa' : 'Inactiva'}
        </div>
        {company.myRole && (
          <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${ROLE_STYLES[company.myRole]}`}>
            {company.myRole.charAt(0) + company.myRole.slice(1).toLowerCase()}
          </div>
        )}
      </div>
    </Link>
  );
}
