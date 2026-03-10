'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useCompanyStore } from '@/stores/company-store';
import { getCompany, listCompanies } from '@/lib/api/companies';
import { getCompanySubscription } from '@/lib/api/subscription';
import { SubscriptionWarningBanner } from '@/components/shared/subscription-warning-banner';
import type { SubscriptionStatus } from '@/lib/types/admin';

const WARNING_STATUSES: SubscriptionStatus[] = ['PAST_DUE', 'BLOCKED'];

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const { companyId } = useParams<{ companyId: string }>();
  const { user } = useAuthStore();
  const { activeCompany, role, setActiveCompany } = useCompanyStore();

  const roleReady = activeCompany?.id === companyId && role;
  const [loading, setLoading] = useState(!roleReady);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'PAST_DUE' | 'BLOCKED' | null>(null);

  // Guard to prevent duplicate fetches for the same companyId
  const fetchingRef = useRef<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    if (activeCompany?.id === companyId && role) {
      setLoading(false);
      return;
    }

    // Skip if already fetching for this companyId
    if (fetchingRef.current === companyId) return;
    fetchingRef.current = companyId;

    setLoading(true);

    // Si el listado ya fue cargado, myRole viene en cada empresa del array
    const companies = useCompanyStore.getState().companies;
    const fromList = companies.find((c) => c.id === companyId);

    getCompany(companyId)
      .then(async (co) => {
        // Bail out if companyId changed while fetching
        if (fetchingRef.current !== companyId) return;

        const resolvedRole = co.myRole ?? fromList?.myRole;
        if (resolvedRole) {
          setActiveCompany(co, resolvedRole);
          return;
        }
        // Fallback: fetch user's companies list to get myRole (works for all roles)
        const allCompanies = await listCompanies().catch(() => []);
        const match = allCompanies.find((c) => c.id === companyId);
        if (match?.myRole) setActiveCompany(co, match.myRole);
      })
      .catch(() => {})
      .finally(() => {
        if (fetchingRef.current === companyId) {
          fetchingRef.current = null;
        }
        setLoading(false);
      });
  }, [companyId, activeCompany?.id, role, user?.id, setActiveCompany]);

  // Fetch subscription status for warning banner (only ADMIN+ can access this endpoint)
  useEffect(() => {
    if (!companyId || !role) return;
    if (role !== 'OWNER' && role !== 'ADMIN') return;
    getCompanySubscription(companyId)
      .then((sub) => {
        if (WARNING_STATUSES.includes(sub.status)) {
          setSubscriptionStatus(sub.status as 'PAST_DUE' | 'BLOCKED');
        } else {
          setSubscriptionStatus(null);
        }
      })
      .catch(() => {
        // No subscription or error — don't show banner
        setSubscriptionStatus(null);
      });
  }, [companyId, role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" role="status" aria-label="Loading">
        <div className="w-5 h-5 border-2 border-[#2563EB] border-t-transparent rounded-full motion-safe:animate-spin" />
      </div>
    );
  }

  return (
    <>
      {subscriptionStatus && (
        <div className="mb-4">
          <SubscriptionWarningBanner status={subscriptionStatus} companyId={companyId} />
        </div>
      )}
      {children}
    </>
  );
}
