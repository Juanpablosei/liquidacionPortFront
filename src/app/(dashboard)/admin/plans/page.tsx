'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from '@/lib/utils/toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { listPlans, deletePlan } from '@/lib/api/admin';
import { PageHeader }     from '@/components/shared/page-header';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState }      from '@/components/shared/empty-state';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { ConfirmDialog }   from '@/components/shared/confirm-dialog';
import { useTranslation }  from '@/lib/i18n';
import { useAuthStore }    from '@/stores/auth-store';
import { cn }              from '@/lib/utils/cn';
import { PlanFormSheet }   from './plan-form-sheet';
import type { SubscriptionPlan } from '@/lib/types/admin';

export default function PlansPage() {
  const t = useTranslation();
  const user = useAuthStore((s) => s.user);
  const canWrite = user?.systemRole === 'SUPER_ADMIN';

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editItem, setEditItem] = useState<SubscriptionPlan | null>(null);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<SubscriptionPlan | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listPlans();
      setPlans(data);
    } catch {
      toast.error(t.admin.loadError);
    } finally {
      setLoading(false);
    }
  }, [t.admin.loadError]);

  useEffect(() => { load(); }, [load]);

  function handleNew() {
    setEditItem(null);
    setSheetOpen(true);
  }

  function handleEdit(plan: SubscriptionPlan) {
    setEditItem(plan);
    setSheetOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deletePlan(deleteTarget.id);
      toast.success(t.admin.planDeleted);
      setDeleteTarget(null);
      await load();
    } catch {
      toast.error(t.admin.deleteError);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <LoadingSkeleton variant="cards" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.admin.plans}
        description={t.admin.plansDesc}
        actions={
          canWrite ? (
            <button
              onClick={handleNew}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#2563EB]/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.admin.newPlan}
            </button>
          ) : undefined
        }
      />

      {plans.length === 0 ? (
        <EmptyState
          icon={<Plus className="w-6 h-6" />}
          title={t.admin.noPlans}
          description={t.admin.noPlansDesc}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-xl border border-white/[0.06] bg-[#111827] p-5 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{plan.code}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
                    plan.isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                      : 'bg-red-500/15 text-red-400 border-red-500/20'
                  )}>
                    {plan.isActive ? t.common.active : t.common.inactive}
                  </span>
                  {canWrite && (
                    <>
                      <button
                        onClick={() => handleEdit(plan)}
                        title={t.admin.editPlan}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(plan)}
                        title={t.admin.deletePlan}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-slate-500">{t.admin.monthly}</p>
                  <p className="text-white font-mono">
                    <CurrencyDisplay amount={Number(plan.monthlyPrice)} />
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t.admin.annual}</p>
                  <p className="text-white font-mono">
                    <CurrencyDisplay amount={Number(plan.annualPrice)} />
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-white/[0.06]">
                <span>{t.admin.maxEmployees}: {plan.maxEmployees}</span>
                <span>{t.admin.trial}: {plan.trialDays}d</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Sheet */}
      <PlanFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editItem={editItem}
        onSuccess={load}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title={t.admin.deletePlan}
        description={t.admin.deletePlanConfirm}
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
