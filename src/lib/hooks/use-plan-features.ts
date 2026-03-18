'use client';

import { useState, useEffect } from 'react';
import { useCompanyStore } from '@/stores/company-store';
import { getCompanySubscription } from '@/lib/api/admin';
import type { PlanFeatures } from '@/lib/types/plan';

interface PlanFeaturesState {
  features: PlanFeatures;
  planCode: string | null;
  isLoading: boolean;
  maxEmployees: number | null;
  maxMembers: number | null;
}

const DEFAULT_FEATURES: PlanFeatures = {
  exportPdf: true,
  unions: true,
  formulas: true,
  aiUpload: true,
};

export function usePlanFeatures(): PlanFeaturesState {
  const { activeCompany } = useCompanyStore();
  const companyId = activeCompany?.id;

  const [features, setFeatures] = useState<PlanFeatures>(DEFAULT_FEATURES);
  const [planCode, setPlanCode] = useState<string | null>(null);
  const [maxEmployees, setMaxEmployees] = useState<number | null>(null);
  const [maxMembers, setMaxMembers] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const sub = await getCompanySubscription(companyId!);
        if (cancelled) return;

        setPlanCode(sub.plan?.code ?? null);
        setMaxEmployees(sub.plan?.maxEmployees ?? null);

        // maxMembers may be present on some plans
        const plan = sub.plan as Record<string, unknown> | undefined;
        if (plan?.maxMembers != null) {
          setMaxMembers(Number(plan.maxMembers));
        }

        // If the plan includes feature flags, use them; otherwise default to all true
        const planFeatures = plan?.features;
        if (planFeatures && typeof planFeatures === 'object') {
          const f = planFeatures as Record<string, boolean>;
          setFeatures({
            exportPdf: f.exportPdf ?? true,
            unions: f.unions ?? true,
            formulas: f.formulas ?? true,
            aiUpload: f.aiUpload ?? true,
          });
        }
      } catch {
        // If subscription fetch fails, default to all features enabled
        // (graceful degradation — don't block users)
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [companyId]);

  return { features, planCode, isLoading, maxEmployees, maxMembers };
}
