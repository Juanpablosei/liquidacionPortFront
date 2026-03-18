'use client';

import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useCompanyStore } from '@/stores/company-store';
import { ROUTES } from '@/lib/constants/routes';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PlanUpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: 'limit' | 'feature';
  /** For limit variant: the specific limit key (employeeLimit, memberLimit, etc.) */
  limitKey?: string;
  /** For limit variant: current usage count */
  currentUsage?: number;
  /** For limit variant: max allowed count */
  maxAllowed?: number;
  /** For feature variant: the feature key (exportPdf, unions, formulas, aiUpload) */
  featureKey?: string;
  /** Current plan code */
  planCode?: string;
}

export function PlanUpgradePrompt({
  open,
  onOpenChange,
  variant,
  limitKey,
  currentUsage,
  maxAllowed,
  featureKey,
  planCode,
}: PlanUpgradePromptProps) {
  const t = useTranslation();
  const { activeCompany } = useCompanyStore();
  const companyId = activeCompany?.id;

  const title = variant === 'limit'
    ? t.plan.upgradeTitle
    : t.plan.upgradeFeatureTitle;

  function getMessage(): string {
    if (variant === 'limit' && limitKey) {
      const key = limitKey as keyof typeof t.plan;
      const template = t.plan[key] as string ?? '';
      return template
        .replace('{current}', String(currentUsage ?? 0))
        .replace('{max}', String(maxAllowed ?? 0));
    }
    if (variant === 'feature' && featureKey) {
      const featureMessages: Record<string, string> = {
        exportPdf: t.plan.featureExportPdf,
        unions: t.plan.featureUnions,
        formulas: t.plan.featureFormulas,
        aiUpload: t.plan.featureAiUpload,
      };
      return featureMessages[featureKey] ?? '';
    }
    return '';
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-sidebar border-border text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {getMessage()}
          </p>

          {planCode && (
            <div className="flex items-center gap-2 rounded-lg bg-overlay-subtle border border-border px-3 py-2">
              <span className="text-xs text-muted-foreground">{t.plan.currentPlan}:</span>
              <span className="text-sm font-semibold text-foreground uppercase">{planCode}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {companyId && (
              <Link
                href={ROUTES.companySettings(companyId)}
                onClick={() => onOpenChange(false)}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                {t.plan.goToSubscription}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground bg-overlay-subtle hover:bg-overlay-strong border border-border transition-colors"
            >
              {t.plan.contactAdmin}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
