'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ColumnDef } from '@tanstack/react-table';
import { toast } from '@/lib/utils/toast';
import { Plus, Pencil, Trash2, CheckCircle2, XCircle, Stethoscope } from 'lucide-react';
import {
  listLeaves, listLeaveTypes, createLeave, reviewLeave, cancelLeave,
  createLeaveType, updateLeaveType, deleteLeaveType,
} from '@/lib/api/leaves';
import { listEmployees } from '@/lib/api/employees';
import { leaveRequestSchema, leaveTypeSchema, type LeaveRequestInput, type LeaveTypeInput } from '@/lib/validators/attendance';
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
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { LeaveRequest, LeaveStatus, LeaveType } from '@/lib/types/leave';
import type { Employee } from '@/lib/types/employee';

const INPUT_CLASS = 'bg-overlay border-border text-foreground placeholder:text-muted-foreground focus:border-brand/50 focus:ring-0';

const LEAVE_STATUS_COLORS: Record<LeaveStatus, string> = {
  PENDING:   'bg-yellow-500/10 text-yellow-400',
  APPROVED:  'bg-emerald-500/10 text-emerald-400',
  REJECTED:  'bg-red-500/10 text-red-400',
  CANCELLED: 'bg-slate-500/10 text-muted-foreground',
};

const LCT_CODE_TO_KEY: Record<string, string> = {
  SICKNESS:      'typeSickness',
  MATERNITY:     'typeMaternity',
  MARRIAGE:      'typeMarriage',
  BEREAVEMENT:   'typeBereavement',
  EXAM:          'typeExam',
  BLOOD_DONATION:'typeBloodDonation',
  MOVING:        'typeMoving',
  UNPAID:        'typeUnpaid',
};

function formatDate(d: string, locale: string): string {
  const iso = d.includes('T') ? d : d + 'T00:00:00';
  return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function LeavesPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { canEdit, canDelete } = usePermissions();
  const t = useTranslation();
  const tl = t.leaves;
  const localeId = useLocaleId();

  const [employees,      setEmployees]      = useState<Employee[]>([]);
  const [leaveTypes,     setLeaveTypes]     = useState<LeaveType[]>([]);
  const [leaves,         setLeaves]         = useState<LeaveRequest[]>([]);
  const [total,          setTotal]          = useState(0);
  const [page,           setPage]           = useState(1);
  const [isLoading,      setIsLoading]      = useState(true);
  const [activeTab,      setActiveTab]      = useState<'requests' | 'types'>('requests');
  const [filterEmp,      setFilterEmp]      = useState('');
  const [filterStatus,   setFilterStatus]   = useState<LeaveStatus | ''>('');
  const [sheetOpen,      setSheetOpen]      = useState(false);
  const [typeSheetOpen,  setTypeSheetOpen]  = useState(false);
  const [editType,       setEditType]       = useState<LeaveType | null>(null);
  const [reviewApprove,  setReviewApprove]  = useState<LeaveRequest | null>(null);
  const [reviewReject,   setReviewReject]   = useState<LeaveRequest | null>(null);
  const [cancelItem,     setCancelItem]     = useState<LeaveRequest | null>(null);
  const [deleteTypeItem, setDeleteTypeItem] = useState<LeaveType | null>(null);
  const [reviewNote,     setReviewNote]     = useState('');
  const [isSaving,       setIsSaving]       = useState(false);
  const [isReviewing,    setIsReviewing]    = useState(false);
  const [isCancelling,   setIsCancelling]   = useState(false);
  const [isDeletingType, setIsDeletingType] = useState(false);
  const LIMIT = 20;

  const STATUS_LABELS: Record<LeaveStatus, string> = {
    PENDING:   tl.statusPending,
    APPROVED:  tl.statusApproved,
    REJECTED:  tl.statusRejected,
    CANCELLED: tl.statusCancelled,
  };

  function getLeaveTypeName(lt: LeaveType): string {
    if (lt.isGlobal) {
      const key = LCT_CODE_TO_KEY[lt.code];
      if (key) return (tl as Record<string, string>)[key] ?? lt.name;
    }
    return lt.name;
  }

  const reqSchema  = useMemo(() => leaveRequestSchema(t.validators),  [t.validators]);
  const typeSchema = useMemo(() => leaveTypeSchema(t.validators), [t.validators]);

  const reqForm  = useForm<LeaveRequestInput>({ resolver: zodResolver(reqSchema), defaultValues: { reason: '' } });
  const typeForm = useForm<LeaveTypeInput>({ resolver: zodResolver(typeSchema), defaultValues: { isPaid: true } });

  const loadTypes = useCallback(async () => {
    try {
      const data = await listLeaveTypes(companyId);
      setLeaveTypes(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  }, [companyId]);

  const loadLeaves = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listLeaves(companyId, {
        employeeId: filterEmp || undefined,
        status:     (filterStatus as LeaveStatus) || undefined,
        page, limit: LIMIT,
      });
      setLeaves(res.items ?? []);
      setTotal(res.total ?? 0);
    } catch {
      toast.error(tl.saveError);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, filterEmp, filterStatus, page, tl.saveError]);

  useEffect(() => {
    listEmployees(companyId, { limit: 100 }).then((r) => setEmployees(r.items)).catch(() => {});
    loadTypes();
  }, [companyId, loadTypes]);

  useEffect(() => {
    if (activeTab === 'requests') loadLeaves();
  }, [activeTab, loadLeaves]);

  async function onSubmitRequest(data: LeaveRequestInput) {
    setIsSaving(true);
    try {
      await createLeave(companyId, data);
      toast.success(tl.created);
      setSheetOpen(false);
      loadLeaves();
    } catch {
      toast.error(tl.saveError);
    } finally {
      setIsSaving(false);
    }
  }

  async function onSubmitType(data: LeaveTypeInput) {
    setIsSaving(true);
    try {
      if (editType) {
        await updateLeaveType(companyId, editType.id, data);
        toast.success(tl.typeUpdated);
      } else {
        await createLeaveType(companyId, data);
        toast.success(tl.typeCreated);
      }
      setTypeSheetOpen(false);
      loadTypes();
    } catch {
      toast.error(tl.saveError);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReview(status: 'APPROVED' | 'REJECTED') {
    const req = status === 'APPROVED' ? reviewApprove : reviewReject;
    if (!req) return;
    setIsReviewing(true);
    try {
      await reviewLeave(companyId, req.id, { status, reviewNote: reviewNote || undefined });
      toast.success(status === 'APPROVED' ? tl.approved : tl.rejected);
      setReviewApprove(null);
      setReviewReject(null);
      setReviewNote('');
      loadLeaves();
    } catch {
      toast.error(tl.reviewError);
    } finally {
      setIsReviewing(false);
    }
  }

  async function handleCancel() {
    if (!cancelItem) return;
    setIsCancelling(true);
    try {
      await cancelLeave(companyId, cancelItem.id);
      toast.success(tl.cancelled);
      setCancelItem(null);
      loadLeaves();
    } catch {
      toast.error(tl.cancelError);
    } finally {
      setIsCancelling(false);
    }
  }

  async function handleDeleteType() {
    if (!deleteTypeItem) return;
    setIsDeletingType(true);
    try {
      await deleteLeaveType(companyId, deleteTypeItem.id);
      toast.success(tl.typeDeleted);
      setDeleteTypeItem(null);
      loadTypes();
    } catch {
      toast.error(tl.saveError);
    } finally {
      setIsDeletingType(false);
    }
  }

  const columns = useMemo((): ColumnDef<LeaveRequest>[] => [
    {
      accessorKey: 'employee',
      header: tl.employee,
      cell: ({ row }) => {
        const e = row.original.employee;
        return e ? `${e.firstName} ${e.lastName}` : row.original.employeeId;
      },
    },
    {
      accessorKey: 'leaveType',
      header: tl.leaveType,
      cell: ({ row }) => {
        const lt = row.original.leaveType;
        return lt ? (
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-foreground">{lt.name}</span>
            <Badge variant={lt.isPaid ? 'default' : 'secondary'} className="text-[10px]">
              {lt.isPaid ? tl.paid : tl.unpaid}
            </Badge>
          </div>
        ) : '—';
      },
    },
    {
      accessorKey: 'startDate',
      header: tl.startDate,
      cell: ({ getValue }) => formatDate(getValue<string>(), localeId),
    },
    {
      accessorKey: 'days',
      header: tl.days,
      cell: ({ getValue }) => <span className="font-mono text-sm">{getValue<number>()}</span>,
    },
    {
      accessorKey: 'status',
      header: tl.status,
      cell: ({ getValue }) => {
        const v = getValue<LeaveStatus>();
        return (
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${LEAVE_STATUS_COLORS[v] ?? ''}`}>
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
                  <CheckCircle2 className="w-3 h-3" />{tl.approve}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setReviewNote(''); setReviewReject(req); }}
                  className="h-7 gap-1 text-xs text-red-400 hover:text-red-400 hover:bg-red-500/[0.06] cursor-pointer">
                  <XCircle className="w-3 h-3" />{tl.reject}
                </Button>
              </>
            )}
            {req.status === 'PENDING' && (
              <Button variant="ghost" size="sm" onClick={() => setCancelItem(req)}
                className="h-7 gap-1 text-xs text-muted-foreground cursor-pointer">
                {tl.cancel}
              </Button>
            )}
          </div>
        );
      },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [tl, localeId, canEdit]);

  const customTypes = leaveTypes.filter((lt) => !lt.isGlobal);
  const globalTypes  = leaveTypes.filter((lt) => lt.isGlobal);

  return (
    <div className="space-y-6">
      <PageHeader
        title={tl.title}
        description={tl.description}
        actions={
          <RoleGate roles={['OWNER', 'ADMIN', 'MANAGER']}>
            <Button onClick={() => { reqForm.reset(); setSheetOpen(true); }} size="sm" className="gap-2 bg-brand hover:bg-brand/90 text-white cursor-pointer">
              <Plus className="w-4 h-4" />{tl.newRequest}
            </Button>
          </RoleGate>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['requests', 'types'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === tab ? 'border-brand text-brand-text' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {tab === 'requests' ? tl.requestTab : tl.typesTab}
          </button>
        ))}
      </div>

      {activeTab === 'requests' && (
        <>
          <div className="flex flex-wrap gap-3">
            <Select value={filterEmp} onValueChange={(v) => { setFilterEmp(v === '__all__' ? '' : v); setPage(1); }}>
              <SelectTrigger className={`${INPUT_CLASS} w-48`}>
                <SelectValue placeholder={tl.allEmployees} />
              </SelectTrigger>
              <SelectContent className="bg-overlay border-border">
                <SelectItem value="__all__">{tl.allEmployees}</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v === '__all__' ? '' : v as LeaveStatus); setPage(1); }}>
              <SelectTrigger className={`${INPUT_CLASS} w-40`}>
                <SelectValue placeholder={tl.allStatuses} />
              </SelectTrigger>
              <SelectContent className="bg-overlay border-border">
                <SelectItem value="__all__">{tl.allStatuses}</SelectItem>
                <SelectItem value="PENDING">{tl.statusPending}</SelectItem>
                <SelectItem value="APPROVED">{tl.statusApproved}</SelectItem>
                <SelectItem value="REJECTED">{tl.statusRejected}</SelectItem>
                <SelectItem value="CANCELLED">{tl.statusCancelled}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {leaves.length === 0 && !isLoading ? (
            <EmptyState
              icon={<Stethoscope className="w-8 h-8 text-muted-foreground" />}
              title={tl.emptyTitle}
              description={tl.emptyDesc}
              action={
                canEdit() ? (
                  <Button onClick={() => { reqForm.reset(); setSheetOpen(true); }} size="sm" className="gap-2 bg-brand hover:bg-brand/90 text-white cursor-pointer">
                    <Plus className="w-4 h-4" />{tl.emptyAction}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <DataTable columns={columns} data={leaves} total={total} page={page} limit={LIMIT} onPageChange={setPage} isLoading={isLoading} />
          )}
        </>
      )}

      {activeTab === 'types' && (
        <div className="space-y-6">
          {/* Global LCT types */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{tl.global}</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {globalTypes.map((lt) => (
                <div key={lt.id} className="rounded-lg bg-card border border-border px-3 py-2 flex items-center justify-between gap-2">
                  <span className="text-sm text-foreground">{getLeaveTypeName(lt)}</span>
                  <Badge variant={lt.isPaid ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                    {lt.isPaid ? tl.paid : tl.unpaid}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Custom types */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{tl.custom}</p>
              <RoleGate roles={['OWNER', 'ADMIN']}>
                <Button size="sm" variant="outline" onClick={() => { setEditType(null); typeForm.reset({ isPaid: true }); setTypeSheetOpen(true); }}
                  className="gap-1.5 border-border cursor-pointer text-xs h-7">
                  <Plus className="w-3 h-3" />{tl.newType}
                </Button>
              </RoleGate>
            </div>
            {customTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground">{tl.emptyTypesDesc}</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {customTypes.map((lt) => (
                  <div key={lt.id} className="rounded-lg bg-card border border-border px-3 py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">{lt.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {lt.maxDays ? `${lt.maxDays}d` : tl.unlimited}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant={lt.isPaid ? 'default' : 'secondary'} className="text-[10px]">
                        {lt.isPaid ? tl.paid : tl.unpaid}
                      </Badge>
                      {canEdit() && (
                        <Button variant="ghost" size="sm"
                          onClick={() => { setEditType(lt); typeForm.reset({ name: lt.name, isPaid: lt.isPaid, maxDays: lt.maxDays ?? undefined }); setTypeSheetOpen(true); }}
                          className="h-6 w-6 p-0 cursor-pointer">
                          <Pencil className="w-3 h-3" />
                        </Button>
                      )}
                      {canDelete() && (
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTypeItem(lt)}
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-400 hover:bg-red-500/[0.06] cursor-pointer">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* New request sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="bg-sidebar border-border">
          <SheetHeader>
            <SheetTitle className="text-foreground">{tl.createTitle}</SheetTitle>
          </SheetHeader>
          <form onSubmit={reqForm.handleSubmit(onSubmitRequest)} className="flex flex-col gap-4 mt-4">
            <FormField name="employeeId" label={tl.employee} error={reqForm.formState.errors.employeeId?.message}>
              <Select onValueChange={(v) => reqForm.setValue('employeeId', v)}>
                <SelectTrigger className={INPUT_CLASS}>
                  <SelectValue placeholder={tl.selectEmployee} />
                </SelectTrigger>
                <SelectContent className="bg-overlay border-border">
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField name="leaveTypeId" label={tl.leaveType} error={reqForm.formState.errors.leaveTypeId?.message}>
              <Select onValueChange={(v) => reqForm.setValue('leaveTypeId', v)}>
                <SelectTrigger className={INPUT_CLASS}>
                  <SelectValue placeholder={tl.selectType} />
                </SelectTrigger>
                <SelectContent className="bg-overlay border-border">
                  {leaveTypes.filter((lt) => lt.isActive).map((lt) => (
                    <SelectItem key={lt.id} value={lt.id}>{getLeaveTypeName(lt)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField name="startDate" label={tl.startDate} error={reqForm.formState.errors.startDate?.message}>
              <Input type="date" {...reqForm.register('startDate')} className={INPUT_CLASS} />
            </FormField>
            <FormField name="endDate" label={tl.endDate} error={reqForm.formState.errors.endDate?.message}>
              <Input type="date" {...reqForm.register('endDate')} className={INPUT_CLASS} />
            </FormField>
            <FormField name="reason" label={tl.reason} error={reqForm.formState.errors.reason?.message}>
              <Input {...reqForm.register('reason')} placeholder={tl.reasonPlaceholder} className={INPUT_CLASS} />
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

      {/* New/edit type sheet */}
      <Sheet open={typeSheetOpen} onOpenChange={setTypeSheetOpen}>
        <SheetContent className="bg-sidebar border-border">
          <SheetHeader>
            <SheetTitle className="text-foreground">
              {editType ? tl.editTypeTitle : tl.createTypeTitle}
            </SheetTitle>
          </SheetHeader>
          <form onSubmit={typeForm.handleSubmit(onSubmitType)} className="flex flex-col gap-4 mt-4">
            <FormField name="name" label={tl.typeName} error={typeForm.formState.errors.name?.message}>
              <Input {...typeForm.register('name')} placeholder={tl.typeNamePlaceholder} className={INPUT_CLASS} />
            </FormField>
            <FormField name="maxDays" label={tl.typeMaxDays} error={typeForm.formState.errors.maxDays?.message}>
              <Input
                type="number" min={1}
                {...typeForm.register('maxDays', { setValueAs: (v) => v === '' ? null : Number(v) })}
                placeholder={tl.unlimited}
                className={INPUT_CLASS}
              />
            </FormField>
            <SheetFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setTypeSheetOpen(false)} className="border-border cursor-pointer">
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
        title={tl.approve}
        description={tl.reviewNote}
        onConfirm={() => handleReview('APPROVED')}
        isLoading={isReviewing}
        confirmLabel={tl.approve}
      />

      {/* Reject */}
      <ConfirmDialog
        open={!!reviewReject}
        onOpenChange={(o) => { if (!o) { setReviewReject(null); setReviewNote(''); } }}
        title={tl.reject}
        description={tl.reviewNote}
        onConfirm={() => handleReview('REJECTED')}
        isLoading={isReviewing}
        confirmLabel={tl.reject}
        variant="danger"
      />

      {/* Cancel */}
      <ConfirmDialog
        open={!!cancelItem}
        onOpenChange={(o) => { if (!o) setCancelItem(null); }}
        title={tl.cancel}
        description={tl.emptyDesc}
        onConfirm={handleCancel}
        isLoading={isCancelling}
      />

      {/* Delete type */}
      <ConfirmDialog
        open={!!deleteTypeItem}
        onOpenChange={(o) => { if (!o) setDeleteTypeItem(null); }}
        title={tl.deleteTypeTitle}
        description={tl.deleteTypeDesc}
        onConfirm={handleDeleteType}
        isLoading={isDeletingType}
        variant="danger"
      />
    </div>
  );
}
