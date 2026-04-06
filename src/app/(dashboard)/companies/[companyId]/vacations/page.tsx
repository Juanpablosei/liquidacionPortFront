'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ColumnDef } from '@tanstack/react-table';
import { toast } from '@/lib/utils/toast';
import { Plus, CheckCircle2, XCircle, Umbrella } from 'lucide-react';
import {
  listVacationRequests, listVacationBalances,
  createVacationRequest, reviewVacationRequest, cancelVacationRequest,
} from '@/lib/api/vacations';
import { listEmployees } from '@/lib/api/employees';
import { vacationRequestSchema, type VacationRequestInput } from '@/lib/validators/attendance';
import { useTranslation, useLocaleId } from '@/lib/i18n';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { RoleGate } from '@/components/shared/role-gate';
import { FormField } from '@/components/shared/form-field';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { VacationRequest, VacationStatus, VacationBalance } from '@/lib/types/vacation';
import type { Employee } from '@/lib/types/employee';

const INPUT_CLASS = 'bg-overlay border-border text-foreground placeholder:text-muted-foreground focus:border-brand/50 focus:ring-0';

const VACATION_STATUS_COLORS: Record<VacationStatus, string> = {
  PENDING:   'bg-yellow-500/10 text-yellow-400',
  APPROVED:  'bg-emerald-500/10 text-emerald-400',
  REJECTED:  'bg-red-500/10 text-red-400',
  CANCELLED: 'bg-slate-500/10 text-muted-foreground',
};

function formatDate(d: string, locale: string): string {
  const iso = d.includes('T') ? d : d + 'T00:00:00';
  return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function VacationsPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { canEdit } = usePermissions();
  const t = useTranslation();
  const tv = t.vacations;
  const localeId = useLocaleId();

  const [employees,    setEmployees]    = useState<Employee[]>([]);
  const [requests,     setRequests]     = useState<VacationRequest[]>([]);
  const [balances,     setBalances]     = useState<VacationBalance[]>([]);
  const [total,        setTotal]        = useState(0);
  const [page,         setPage]         = useState(1);
  const [isLoading,    setIsLoading]    = useState(true);
  const [activeTab,    setActiveTab]    = useState<'requests' | 'balances'>('requests');
  const [filterEmp,    setFilterEmp]    = useState('');
  const [filterStatus, setFilterStatus] = useState<VacationStatus | ''>('');
  const [sheetOpen,    setSheetOpen]    = useState(false);
  const [reviewApprove,setReviewApprove]= useState<VacationRequest | null>(null);
  const [reviewReject, setReviewReject] = useState<VacationRequest | null>(null);
  const [cancelItem,   setCancelItem]   = useState<VacationRequest | null>(null);
  const [reviewNote,   setReviewNote]   = useState('');
  const [isSaving,     setIsSaving]     = useState(false);
  const [isReviewing,  setIsReviewing]  = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const LIMIT = 20;

  const STATUS_LABELS: Record<VacationStatus, string> = {
    PENDING:   tv.statusPending,
    APPROVED:  tv.statusApproved,
    REJECTED:  tv.statusRejected,
    CANCELLED: tv.statusCancelled,
  };

  const schema = useMemo(() => vacationRequestSchema(t.validators), [t.validators]);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<VacationRequestInput>({
    resolver: zodResolver(schema),
    defaultValues: { reason: '' },
  });

  useEffect(() => {
    listEmployees(companyId, { limit: 100 }).then((r) => setEmployees(r.items)).catch(() => {});
  }, [companyId]);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listVacationRequests(companyId, {
        employeeId: filterEmp || undefined,
        status:     (filterStatus as VacationStatus) || undefined,
        page, limit: LIMIT,
      });
      setRequests(res.items ?? []);
      setTotal(res.total ?? 0);
    } catch {
      toast.error(tv.saveError);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, filterEmp, filterStatus, page, tv.saveError]);

  const loadBalances = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listVacationBalances(companyId);
      setBalances(Array.isArray(data) ? data : []);
    } catch {
      toast.error(tv.saveError);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, tv.saveError]);

  useEffect(() => {
    if (activeTab === 'requests') loadRequests();
    else loadBalances();
  }, [activeTab, loadRequests, loadBalances]);

  async function onSubmit(data: VacationRequestInput) {
    setIsSaving(true);
    try {
      await createVacationRequest(companyId, data);
      toast.success(tv.created);
      setSheetOpen(false);
      loadRequests();
    } catch {
      toast.error(tv.saveError);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReview(status: 'APPROVED' | 'REJECTED') {
    const req = status === 'APPROVED' ? reviewApprove : reviewReject;
    if (!req) return;
    setIsReviewing(true);
    try {
      await reviewVacationRequest(companyId, req.id, { status, reviewNote: reviewNote || undefined });
      toast.success(status === 'APPROVED' ? tv.approved : tv.rejected);
      setReviewApprove(null);
      setReviewReject(null);
      setReviewNote('');
      loadRequests();
    } catch {
      toast.error(tv.reviewError);
    } finally {
      setIsReviewing(false);
    }
  }

  async function handleCancel() {
    if (!cancelItem) return;
    setIsCancelling(true);
    try {
      await cancelVacationRequest(companyId, cancelItem.id);
      toast.success(tv.cancelled);
      setCancelItem(null);
      loadRequests();
    } catch {
      toast.error(tv.cancelError);
    } finally {
      setIsCancelling(false);
    }
  }

  const columns = useMemo((): ColumnDef<VacationRequest>[] => [
    {
      accessorKey: 'employee',
      header: tv.employee,
      cell: ({ row }) => {
        const e = row.original.employee;
        return e ? `${e.firstName} ${e.lastName}` : row.original.employeeId;
      },
    },
    {
      accessorKey: 'startDate',
      header: tv.startDate,
      cell: ({ getValue }) => formatDate(getValue<string>(), localeId),
    },
    {
      accessorKey: 'endDate',
      header: tv.endDate,
      cell: ({ getValue }) => formatDate(getValue<string>(), localeId),
    },
    {
      accessorKey: 'days',
      header: tv.days,
      cell: ({ getValue }) => <span className="font-mono text-sm">{getValue<number>()}</span>,
    },
    {
      accessorKey: 'status',
      header: tv.status,
      cell: ({ getValue }) => {
        const v = getValue<VacationStatus>();
        return (
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${VACATION_STATUS_COLORS[v] ?? ''}`}>
            {STATUS_LABELS[v] ?? v}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const req = row.original;
        return (
          <div className="flex gap-1 justify-end">
            {canEdit() && req.status === 'PENDING' && (
              <>
                <Button variant="ghost" size="sm" onClick={() => { setReviewNote(''); setReviewApprove(req); }}
                  className="h-7 gap-1 text-xs text-green-400 hover:text-green-400 hover:bg-green-500/[0.08] cursor-pointer">
                  <CheckCircle2 className="w-3 h-3" />{tv.approve}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setReviewNote(''); setReviewReject(req); }}
                  className="h-7 gap-1 text-xs text-red-400 hover:text-red-400 hover:bg-red-500/[0.06] cursor-pointer">
                  <XCircle className="w-3 h-3" />{tv.reject}
                </Button>
              </>
            )}
            {req.status === 'PENDING' && (
              <Button variant="ghost" size="sm" onClick={() => setCancelItem(req)}
                className="h-7 gap-1 text-xs text-muted-foreground cursor-pointer">
                {tv.cancel}
              </Button>
            )}
          </div>
        );
      },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [tv, localeId, canEdit]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={tv.title}
        description={tv.description}
        actions={
          <RoleGate roles={['OWNER', 'ADMIN', 'MANAGER']}>
            <Button onClick={() => { reset(); setSheetOpen(true); }} size="sm" className="gap-2 bg-brand hover:bg-brand/90 text-white cursor-pointer">
              <Plus className="w-4 h-4" />{tv.newRequest}
            </Button>
          </RoleGate>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['requests', 'balances'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === tab ? 'border-brand text-brand-text' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {tab === 'requests' ? tv.requestTab : tv.balancesTab}
          </button>
        ))}
      </div>

      {activeTab === 'requests' && (
        <>
          <div className="flex flex-wrap gap-3">
            <Select value={filterEmp} onValueChange={(v) => { setFilterEmp(v === '__all__' ? '' : v); setPage(1); }}>
              <SelectTrigger className={`${INPUT_CLASS} w-48`}>
                <SelectValue placeholder={tv.allEmployees} />
              </SelectTrigger>
              <SelectContent className="bg-overlay border-border">
                <SelectItem value="__all__">{tv.allEmployees}</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v === '__all__' ? '' : v as VacationStatus); setPage(1); }}>
              <SelectTrigger className={`${INPUT_CLASS} w-40`}>
                <SelectValue placeholder={tv.allStatuses} />
              </SelectTrigger>
              <SelectContent className="bg-overlay border-border">
                <SelectItem value="__all__">{tv.allStatuses}</SelectItem>
                <SelectItem value="PENDING">{tv.statusPending}</SelectItem>
                <SelectItem value="APPROVED">{tv.statusApproved}</SelectItem>
                <SelectItem value="REJECTED">{tv.statusRejected}</SelectItem>
                <SelectItem value="CANCELLED">{tv.statusCancelled}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {requests.length === 0 && !isLoading ? (
            <EmptyState
              icon={<Umbrella className="w-8 h-8 text-muted-foreground" />}
              title={tv.emptyRequestsTitle}
              description={tv.emptyRequestsDesc}
              action={
                canEdit() ? (
                  <Button onClick={() => { reset(); setSheetOpen(true); }} size="sm" className="gap-2 bg-brand hover:bg-brand/90 text-white cursor-pointer">
                    <Plus className="w-4 h-4" />{tv.emptyAction}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <DataTable columns={columns} data={requests} total={total} page={page} limit={LIMIT} onPageChange={setPage} isLoading={isLoading} />
          )}
        </>
      )}

      {activeTab === 'balances' && (
        <div className="space-y-4">
          {balances.length === 0 && !isLoading ? (
            <EmptyState
              icon={<Umbrella className="w-8 h-8 text-muted-foreground" />}
              title={tv.emptyBalancesTitle}
              description={tv.emptyBalancesDesc}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {balances.map((b) => (
                <div key={b.employeeId} className="rounded-xl bg-card border border-border p-4 space-y-3">
                  <div>
                    <p className="font-medium text-foreground">{b.employeeName}</p>
                    <p className="text-xs text-muted-foreground">{tv.seniority}: {b.seniorityYears} {tv.years}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">{tv.entitled}</p>
                      <p className="font-mono font-semibold">{b.entitledDays}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">{tv.available}</p>
                      <p className="font-mono font-semibold text-green-400">{b.availableDays}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">{tv.used}</p>
                      <p className="font-mono">{b.usedDays}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">{tv.pending}</p>
                      <p className="font-mono text-yellow-400">{b.pendingDays}</p>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-overlay overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all"
                      style={{ width: `${b.entitledDays > 0 ? Math.min(100, (b.usedDays / b.entitledDays) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New request sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="bg-sidebar border-border">
          <SheetHeader>
            <SheetTitle className="text-foreground">{tv.createTitle}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-4">
            <FormField name="employeeId" label={tv.employee} error={errors.employeeId?.message}>
              <Select onValueChange={(v) => setValue('employeeId', v)}>
                <SelectTrigger className={INPUT_CLASS}>
                  <SelectValue placeholder={tv.selectEmployee} />
                </SelectTrigger>
                <SelectContent className="bg-overlay border-border">
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField name="startDate" label={tv.startDate} error={errors.startDate?.message}>
              <Input type="date" {...register('startDate')} className={INPUT_CLASS} />
            </FormField>
            <FormField name="endDate" label={tv.endDate} error={errors.endDate?.message}>
              <Input type="date" {...register('endDate')} className={INPUT_CLASS} />
            </FormField>
            <FormField name="reason" label={tv.reason} error={errors.reason?.message}>
              <Input {...register('reason')} placeholder={tv.reasonPlaceholder} className={INPUT_CLASS} />
            </FormField>
            <SheetFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} className="border-border cursor-pointer">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-brand hover:bg-brand/90 text-white cursor-pointer">
                {isSaving ? '...' : 'Guardar'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Approve */}
      <ConfirmDialog
        open={!!reviewApprove}
        onOpenChange={(o) => { if (!o) { setReviewApprove(null); setReviewNote(''); } }}
        title={tv.approve}
        description={tv.reviewNote}
        onConfirm={() => handleReview('APPROVED')}
        isLoading={isReviewing}
        confirmLabel={tv.approve}
      />

      {/* Reject */}
      <ConfirmDialog
        open={!!reviewReject}
        onOpenChange={(o) => { if (!o) { setReviewReject(null); setReviewNote(''); } }}
        title={tv.reject}
        description={tv.reviewNote}
        onConfirm={() => handleReview('REJECTED')}
        isLoading={isReviewing}
        confirmLabel={tv.reject}
        variant="danger"
      />

      {/* Cancel */}
      <ConfirmDialog
        open={!!cancelItem}
        onOpenChange={(o) => { if (!o) setCancelItem(null); }}
        title={tv.deleteTitle}
        description={tv.deleteDesc}
        onConfirm={handleCancel}
        isLoading={isCancelling}
      />
    </div>
  );
}
