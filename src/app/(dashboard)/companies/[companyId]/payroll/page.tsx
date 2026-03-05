'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Play,
  CalendarRange,
  Receipt,
} from 'lucide-react';
import { listPeriods, createPeriod, listRuns, createRun } from '@/lib/api/payroll';
import { createPeriodSchema, type CreatePeriodInput } from '@/lib/validators/payroll';
import { ROUTES } from '@/lib/constants/routes';
import { PageHeader }    from '@/components/shared/page-header';
import { StatusBadge }   from '@/components/shared/status-badge';
import { FormField }     from '@/components/shared/form-field';
import { EmptyState }    from '@/components/shared/empty-state';
import { RoleGate }      from '@/components/shared/role-gate';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { useTranslation, useLocaleId } from '@/lib/i18n';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import type { PayrollPeriod, PayrollRun, PayrollPeriodType } from '@/lib/types/payroll';

const INPUT_CLASS = 'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 focus:border-[#2563EB]/50 focus:ring-0';

function formatDate(d: string, locale: string) {
  const iso = d.includes('T') ? d : d + 'T00:00:00';
  return new Date(iso).toLocaleDateString(locale, {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatDateTime(d: string, locale: string) {
  return new Date(d).toLocaleDateString(locale, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function PayrollPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const router = useRouter();
  const { isManager, canEdit } = usePermissions();
  const t = useTranslation();
  const localeId = useLocaleId();

  const periodTypeLabels: Record<PayrollPeriodType, string> = {
    MONTHLY:   t.payroll.periodTypes.MONTHLY,
    BIWEEKLY:  t.payroll.periodTypes.BIWEEKLY,
    WEEKLY:    t.payroll.periodTypes.WEEKLY,
    CUSTOM:    t.payroll.periodTypes.CUSTOM,
  };

  const [periods,      setPeriods]      = useState<PayrollPeriod[]>([]);
  const [runsMap,      setRunsMap]      = useState<Record<string, PayrollRun[]>>({});
  const [expandedIds,  setExpandedIds]  = useState<Set<string>>(new Set());
  const [isLoading,    setIsLoading]    = useState(true);
  const [sheetOpen,    setSheetOpen]    = useState(false);
  const [isSaving,     setIsSaving]     = useState(false);
  const [creatingRun,  setCreatingRun]  = useState<string | null>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CreatePeriodInput>({
    resolver: zodResolver(createPeriodSchema(t.validators)),
    defaultValues: { periodType: 'MONTHLY' },
  });

  const load = useCallback(() => {
    if (!companyId) return;
    setIsLoading(true);
    listPeriods(companyId)
      .then(setPeriods)
      .catch((err: Error) => toast.error(err.message ?? t.payroll.periodsLoadError))
      .finally(() => setIsLoading(false));
  }, [companyId, t.payroll.periodsLoadError]);

  useEffect(() => { load(); }, [load]);

  async function toggleExpand(periodId: string) {
    const next = new Set(expandedIds);
    if (next.has(periodId)) {
      next.delete(periodId);
    } else {
      next.add(periodId);
      if (!runsMap[periodId]) {
        try {
          const runs = await listRuns(companyId, periodId);
          setRunsMap((prev) => ({ ...prev, [periodId]: runs }));
        } catch {
          setRunsMap((prev) => ({ ...prev, [periodId]: [] }));
        }
      }
    }
    setExpandedIds(next);
  }

  async function handleCreateRun(periodId: string) {
    setCreatingRun(periodId);
    try {
      const run = await createRun(companyId, { periodId });
      toast.success(t.payroll.runCreated);
      setRunsMap((prev) => ({
        ...prev,
        [periodId]: [...(prev[periodId] ?? []), run],
      }));
      setExpandedIds((prev) => new Set([...prev, periodId]));
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.payroll.runCreateError);
    } finally {
      setCreatingRun(null);
    }
  }

  async function onSubmit(data: CreatePeriodInput) {
    setIsSaving(true);
    try {
      await createPeriod(companyId, {
        periodType: data.periodType,
        startDate:  data.startDate,
        endDate:    data.endDate,
        name:       data.name || undefined,
      });
      toast.success(t.payroll.periodCreated);
      setSheetOpen(false);
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.payroll.periodCreateError);
    } finally {
      setIsSaving(false);
    }
  }

  if (!isManager()) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400 text-sm">{t.common.noPermission}</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={t.payroll.title}
        description={t.payroll.description}
        backHref={ROUTES.company(companyId)}
        actions={
          <RoleGate roles={['OWNER', 'ADMIN']}>
            <button
              onClick={() => { reset({ periodType: 'MONTHLY', startDate: '', endDate: '', name: '' }); setSheetOpen(true); }}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.payroll.newPeriod}
            </button>
          </RoleGate>
        }
      />

      {isLoading ? (
        <PeriodsSkeleton />
      ) : periods.length === 0 ? (
        <EmptyPeriods
          onNew={() => setSheetOpen(true)}
          canEdit={canEdit()}
          emptyTitle={t.payroll.emptyTitle}
          emptyDesc={t.payroll.emptyDesc}
          emptyAction={t.payroll.emptyAction}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {periods.map((period) => {
            const isExpanded = expandedIds.has(period.id);
            const runs = runsMap[period.id] ?? [];
            const isClosed = !!period.closedAt;

            return (
              <div
                key={period.id}
                className="bg-[#0B1220] border border-white/[0.07] rounded-2xl overflow-hidden transition-all"
              >
                {/* Period header row */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleExpand(period.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(period.id); } }}
                  className="w-full text-left flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors duration-150 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563EB]/50"
                >
                  <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-300" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1">
                      <span className="text-sm font-medium text-white">
                        {period.name ?? `${periodTypeLabels[period.periodType]} — ${formatDate(period.startDate, localeId)}`}
                      </span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-400 border border-white/[0.06]">
                        {periodTypeLabels[period.periodType]}
                      </span>
                      {isClosed && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {t.payroll.closed}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      {formatDate(period.startDate, localeId)} → {formatDate(period.endDate, localeId)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isExpanded && (
                      <span className="text-xs text-slate-500 font-mono">{runs.length} run{runs.length !== 1 ? 's' : ''}</span>
                    )}
                    {canEdit() && !isClosed && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCreateRun(period.id); }}
                        disabled={creatingRun === period.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB]/15 border border-[#2563EB]/25 text-[#93BBFC] text-xs font-medium hover:bg-[#2563EB]/25 transition-colors duration-150 disabled:opacity-50 cursor-pointer"
                      >
                        <Play className="w-3 h-3" />
                        {creatingRun === period.id ? t.common.creating : t.payroll.newRun}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded: runs list */}
                {isExpanded && (
                  <div className="border-t border-white/[0.05] px-5 py-3 flex flex-col gap-2">
                    {runs.length === 0 ? (
                      <p className="text-xs text-slate-500 py-2 text-center">{t.payroll.noRuns}</p>
                    ) : (
                      runs.map((run) => (
                        <button
                          key={run.id}
                          onClick={() => router.push(ROUTES.payrollRun(companyId, run.id))}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.04] transition-all text-left group"
                        >
                          <div className="relative flex-shrink-0">
                            <Receipt className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                            {run.status === 'RUNNING' && (
                              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-yellow-400 motion-safe:animate-pulse" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-400 font-mono truncate">
                              {t.payroll.run.replace('{id}', run.id.slice(-8).toUpperCase())}
                            </p>
                            {run.runAt && (
                              <p className="text-[11px] text-slate-600">{formatDateTime(run.runAt, localeId)}</p>
                            )}
                          </div>
                          <StatusBadge status={run.status} />
                          <ChevronDown className="w-3.5 h-3.5 text-slate-600 -rotate-90 group-hover:text-slate-400 transition-colors" />
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Sheet: crear periodo */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          className="bg-[#060B16] border-l border-white/[0.08] text-white overflow-y-auto"
          style={{ width: 440, maxWidth: '100vw' }}
        >
          <SheetHeader className="pb-4 border-b border-white/[0.06]">
            <SheetTitle className="text-white">{t.payroll.periodForm.title}</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
            <FormField label={t.payroll.periodForm.type} name="periodType" error={errors.periodType?.message} required>
              <div className="grid grid-cols-2 gap-2">
                {(['MONTHLY', 'BIWEEKLY', 'WEEKLY', 'CUSTOM'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setValue('periodType', type)}
                    aria-pressed={watch('periodType') === type}
                    className={`py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                      watch('periodType') === type
                        ? 'bg-[#2563EB]/20 border-[#2563EB]/40 text-[#93BBFC]'
                        : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:border-white/[0.15]'
                    }`}
                  >
                    {periodTypeLabels[type]}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label={t.payroll.periodForm.name} name="name" error={errors.name?.message}>
              <Input
                {...register('name')}
                placeholder={t.payroll.periodForm.namePlaceholder}
                className={INPUT_CLASS}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label={t.payroll.periodForm.start} name="startDate" error={errors.startDate?.message} required>
                <Input type="date" {...register('startDate')} className={INPUT_CLASS} />
              </FormField>
              <FormField label={t.payroll.periodForm.end} name="endDate" error={errors.endDate?.message} required>
                <Input type="date" {...register('endDate')} className={INPUT_CLASS} />
              </FormField>
            </div>

            <SheetFooter className="px-0 mt-2 flex-row gap-2">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors disabled:opacity-50"
              >
                {isSaving ? t.common.creating : t.payroll.periodForm.submit}
              </button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}

function PeriodsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-[#0B1220] border border-white/[0.07] rounded-2xl px-5 py-4 motion-safe:animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-4 h-4 bg-white/[0.06] rounded" />
            <div className="flex-1">
              <div className="h-4 bg-white/[0.06] rounded w-48 mb-2" />
              <div className="h-3 bg-white/[0.04] rounded w-32" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyPeriods({ onNew, canEdit, emptyTitle, emptyDesc, emptyAction }: {
  onNew: () => void;
  canEdit: boolean;
  emptyTitle: string;
  emptyDesc: string;
  emptyAction: string;
}) {
  return (
    <EmptyState
      icon={<CalendarRange className="w-6 h-6" />}
      title={emptyTitle}
      description={emptyDesc}
      action={
        canEdit ? (
          <button
            onClick={onNew}
            className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {emptyAction}
          </button>
        ) : undefined
      }
    />
  );
}
