'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useCompanyStore } from '@/stores/company-store';
import { getCompany, listMembers } from '@/lib/api/companies';

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const { companyId } = useParams<{ companyId: string }>();
  const { user } = useAuthStore();
  const { activeCompany, companies, role, setActiveCompany } = useCompanyStore();

  const roleReady = activeCompany?.id === companyId && role;
  const [loading, setLoading] = useState(!roleReady);

  useEffect(() => {
    if (!companyId) return;
    if (activeCompany?.id === companyId && role) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Si el listado ya fue cargado, myRole viene en cada empresa del array
    const fromList = companies.find((c) => c.id === companyId);

    getCompany(companyId)
      .then(async (co) => {
        const resolvedRole = co.myRole ?? fromList?.myRole;
        if (resolvedRole) {
          setActiveCompany(co, resolvedRole);
          return;
        }
        // Fallback: navegar directo a la URL sin pasar por /companies
        const mems = await listMembers(companyId).catch(() => []);
        const me = mems.find((m) => m.userId === user?.id);
        if (me) setActiveCompany(co, me.role);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [companyId, activeCompany?.id, role, companies, user?.id, setActiveCompany]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" role="status" aria-label="Loading">
        <div className="w-5 h-5 border-2 border-[#2563EB] border-t-transparent rounded-full motion-safe:animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
