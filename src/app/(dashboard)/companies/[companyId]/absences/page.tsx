'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ColumnDef } from '@tanstack/react-table';
import { toast } from '@/lib/utils/toast';
import { Plus, Pencil, Trash2, CheckCircle2, XCircle, UserMinus } from 'lucide-react';
import {
  listAbsences, createAbsence, updateAbsence, reviewAbsence, deleteAbsence,
  getAbsenteeismReport,
} from '@/lib/api/absences';
import { listEmployees } from '@/lib/api/employees';
import { absenceSchema, type AbsenceInput } from '@/lib/validators/attendance';
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
import type { Absence, AbsenceType, AbsenceStatus, AbsenteeismReportEntry } from '@/lib/types/absence';
import type { Employee } from '@/lib/types/employee';

const INPUT_CLASS = 'bg-overlay border-border text-foreground placeholder:text-muted-foreground focus:border-brand/50 focus:ring-0';

const ABSENCE_STATUS_COLORS: Record<AbsenceStatus, string> = {
  PENDING:  'bg-yellow-500/10 text-yellow-400',
  APPROVED: 'bg-emerald-500/10 text-emerald-400',
  REJECTED: 'bg-red-500/10 text-red-400',
};

function formatDate(d: string, locale: string): string {
  const iso = d.includes('T') ? d : d + 'T00:00:00';
  return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AbsencesPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { canEdit, canDelete } = usePermissions();
  const t = useTranslation();
  const ta = t.absences;
  const localeId = useLocaleId();

  const [employees,     setEmployees]     = useState<Employee[]>([]);
  const [absences,      setAbsences]      = useState<Absence[]>([]);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(1);
  const [isLoading,     setIsLoading]     = useState(true);
  const [activeTab,     setActiveTab]     = useState<'list' | 'report'>('list');
  const [report,        setReport]        = useState<AbsenteeismReportEntry[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [filterEmp,     setFilterEmp]     = useState('');
  const [filterType,    setFilterType]    = useState<AbsenceType | ''>('');
  const [filterStatus,  setFilterStatus]  = useState<AbsenceStatus | ''>('');
  const [filterFrom,    setFilterFrom]    = useState('');
  const [filterTo,      setFilterTo]      = useState('');
  const [sheetOpen,     setSheetOpen]     = useState(false);
  const [editItem,      setEditItem]      = useState<Absence | null>(null);
  const [deleteItem,    setDeleteItem]    = useState<Absence | null>(null);
  const [reviewApprove, setReviewApprove] = useState<Absence | null>(null);
  const [reviewReject,  setReviewReject]  = useState<Absence | null>(null);
  const [reviewNote,    setReviewNote]    = useState('');
  const [isDeleting,    setIsDeleting]    = useState(false);
  const [isSaving,      setIsSaving]      = useState(false);
  const [isReviewing,   setIsReviewing]   = useState(false);
  const LIMIT = 20;

  const TYPE_LABELS: Record<AbsenceType, string> = {
    UNJUSTIFIED: ta.typeUnjustified,
    JUSTIFIED:   ta.typeJustified,
    NOTIFIED:    ta.typeNotified,
  };
  const STATUS_LABELS: Record<AbsenceStatus, string> = {
    PENDING:  ta.statusPending,
    APPROVED: ta.statusApproved,
    REJECTED: ta.statusRejected,
  };

  const schema = useMemo(() => absenceSchema(t.validators), [t.validators]);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<AbsenceInput>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'UNJUSTIFIED' },
  });

  useEffect(() => {
    listEmployees(companyId, { limit: 100 }).then((r) => setEmployees(r.items)).catch(() => {});
  }, [companyId]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listAbsences(companyId, {
        employeeId: filterEmp || undefined,
        type:       (filterType as AbsenceType) || undefined,
        status:     (filterStatus as AbsenceStatus) || undefined,
        fromDate:   filterFrom || undefined,
        toDate:     filterTo || undefined,
        page, limit: LIMIT,
      });
      setAbsences(res.items ?? []);
      setTotal(res.total ?? 0);
    } catch {
      toast.error(ta.saveError);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, filterEmp, filterType, filterStatus, filterFrom, filterTo, page, ta.saveError]);

  useEffect(() => { load(); }, [load]);

  async function loadReport() {
    setReportLoading(true);
    try {
      const data = await getAbsenteeismReport(companyId, {
        fromDate: filterFrom || undefined,
        toDate:   filterTo || undefined,
      });
      setReport(Array.isArray(data) ? data : []);
    } catch {
      toast.error(ta.saveError);
    } finally {
      setReportLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === 'report') loadReport();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  function openCreate() {
    setEditItem(null);
    reset({ employeeId: '', date: '', type: 'UNJUSTIFIED', reason: '' });
    setSheetOpen(true);
  }

  function openEdit(a: Absence) {
    setEditItem(a);
    reset({ employeeId: a.employeeId, date: a.date, type: a.type, reason: a.reason ?? '' });
    setSheetOpen(true);
  }

  async function onSubmit(data: AbsenceInput) {
    setIsSaving(true);
    try {
      if (editItem) {
        await updateAbsence(companyId, editItem.id, { type: data.type, reason: data.reason });
        toast.success(ta.updated);
      } else {
        await createAbsence(companyId, data);
        toast.success(ta.created);
      }
      setSheetOpen(false);
      load();
    } catch {
      toast.error(ta.saveError);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      await deleteAbsence(companyId, deleteItem.id);
      toast.success(ta.deleted);
      setDeleteItem(null);
      load();
    } catch {
      toast.error(ta.deleteError);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleReview(status: 'APPROVED' | 'REJECTED') {
    const abs = status === 'APPROVED' ? reviewApprove : reviewReject;
    if (!abs) return;
    setIsReviewing(true);
    try {
      await reviewAbsence(companyId, abs.id, { status, reviewNote: reviewNote || undefined });
      toast.success(status === 'APPROVED' ? ta.approved : ta.rejected);
      setReviewApprove(null);
      setReviewReject(null);
      setReviewNote('');
      load();
    } catch {
      toast.error(ta.reviewError);
    } finally {
      setIsReviewing(false);
    }
  }

  const columns = useMemo((): ColumnDef<Absence>[] => [
    {
      accessorKey: 'employee',
      header: ta.employee,
      cell: ({ row }) => {
        const e = row.original.employee;
        return e ? `${e.firstName} ${e.lastName}` : row.original.employeeId;
      },
    },
    {
      accessorKey: 'date',
      header: ta.date,
      cell: ({ getValue }) => formatDate(getValue<string>(), localeId),
    },
    {
      accessorKey: 'type',
      header: ta.type,
      cell: ({ getValue }) => {
        const v = getValue<AbsenceType>();
        return <span className="text-xs text-muted-foreground">{TYPE_LABELS[v] ?? v}</span>;
      },
    },
    {
      accessorKey: 'status',
      header: ta.status,
      cell: ({ getValue }) => {
        const v = getValue<AbsenceStatus>();
        return (
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${ABSENCE_STATUS_COLORS[v] ?? ''}`}>
            {STATUS_LABELS[v] ?? v}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const abs = row.original;
        return (
          <div className="flex gap-1 justify-end">
            {canEdit() && abs.status === 'PENDING' && (
              <>
                <Button variant="ghost" size="sm" onClick={() => { setReviewNote(''); setReviewApprove(abs); }}
                  className="h-7 gap-1 text-xs text-green-400 hover:text-green-400 hover:bg-green-500/[0.08] cursor-pointer">
                  <CheckCircle2 className="w-3 h-3" />{ta.approve}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setReviewNote(''); setReviewReject(abs); }}
                  className="h-7 gap-1 text-xs text-red-400 hover:text-red-400 hover:bg-red-500/[0.06] cursor-pointer">
                  <XCircle className="w-3 h-3" />{ta.reject}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(abs)}
                  className="h-7 gap-1 text-xs text-muted-foreground cursor-pointer">
                  <Pencil className="w-3 h-3" />
                </Button>
              </>
            )}
            {canDelete() && abs.status === 'PENDING' && (
              <Button variant="ghost" size="sm" onClick={() => setDeleteItem(abs)}
                className="h-7 gap-1 text-xs text-red-400 hover:text-red-400 hover:bg-red-500/[0.06] cursor-pointer">
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        );
      },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [ta, localeId, canEdit, canDelete]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={ta.title}
        description={ta.description}
        actions={
          <RoleGate roles={['OWNER', 'ADMIN', 'MANAGER']}>
            <Button onClick={openCreate} size="sm" className="gap-2 bg-brand hover:bg-brand/90 text-white cursor-pointer">
              <Plus className="w-4 h-4" />{ta.register}
            </Button>
          </RoleGate>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['list', 'report'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === tab
                ? 'border-brand text-brand-text'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'list' ? ta.listTab : ta.reportTab}
          </button>
        ))}
      </div>

      {activeTab === 'list' && (
        <>
          <div className="flex flex-wrap gap-3">
            <Select value={filterEmp} onValueChange={(v) => { setFilterEmp(v === '__all__' ? '' : v); setPage(1); }}>
              <SelectTrigger className={`${INPUT_CLASS} w-48`}>
                <SelectValue placeholder={ta.allEmployees} />
              </SelectTrigger>
              <SelectContent className="bg-overlay border-border">
                <SelectItem value="__all__">{ta.allEmployees}</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={(v) => { setFilterType(v === '__all__' ? '' : v as AbsenceType); setPage(1); }}>
              <SelectTrigger className={`${INPUT_CLASS} w-40`}>
                <SelectValue placeholder={ta.allTypes} />
              </SelectTrigger>
              <SelectContent className="bg-overlay border-border">
                <SelectItem value="__all__">{ta.allTypes}</SelectItem>
                <SelectItem value="UNJUSTIFIED">{ta.typeUnjustified}</SelectItem>
                <SelectItem value="JUSTIFIED">{ta.typeJustified}</SelectItem>
                <SelectItem value="NOTIFIED">{ta.typeNotified}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v === '__all__' ? '' : v as AbsenceStatus); setPage(1); }}>
              <SelectTrigger className={`${INPUT_CLASS} w-40`}>
                <SelectValue placeholder={ta.allStatuses} />
              </SelectTrigger>
              <SelectContent className="bg-overlay border-border">
                <SelectItem value="__all__">{ta.allStatuses}</SelectItem>
                <SelectItem value="PENDING">{ta.statusPending}</SelectItem>
                <SelectItem value="APPROVED">{ta.statusApproved}</SelectItem>
                <SelectItem value="REJECTED">{ta.statusRejected}</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={filterFrom} onChange={(e) => { setFilterFrom(e.target.value); setPage(1); }} className={`${INPUT_CLASS} w-40`} />
            <Input type="date" value={filterTo} onChange={(e) => { setFilterTo(e.target.value); setPage(1); }} className={`${INPUT_CLASS} w-40`} />
          </div>

          {absences.length === 0 && !isLoading ? (
            <EmptyState
              icon={<UserMinus className="w-8 h-8 text-muted-foreground" />}
              title={ta.emptyTitle}
              description={ta.emptyDesc}
              action={
                canEdit() ? (
                  <Button onClick={openCreate} size="sm" className="gap-2 bg-brand hover:bg-brand/90 text-white cursor-pointer">
                    <Plus className="w-4 h-4" />{ta.emptyAction}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <DataTable
              columns={columns}
              data={absences}
              total={total}
              page={page}
              limit={LIMIT}
              onPageChange={setPage}
              isLoading={isLoading}
            />
          )}
        </>
      )}

      {activeTab === 'report' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className={`${INPUT_CLASS} w-40`} />
            <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className={`${INPUT_CLASS} w-40`} />
            <Button onClick={loadReport} size="sm" variant="outline" className="border-border cursor-pointer">
              {reportLoading ? '...' : 'Actualizar'}
            </Button>
          </div>
          {report.length === 0 ? (
            <p className="text-sm text-muted-foreground">{ta.reportEmpty}</p>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-card border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-2 text-muted-foreground font-medium">{ta.reportEmployee}</th>
                    <th className="text-right px-4 py-2 text-muted-foreground font-medium">{ta.reportTotal}</th>
                    <th className="text-right px-4 py-2 text-muted-foreground font-medium">{ta.reportJustified}</th>
                    <th className="text-right px-4 py-2 text-muted-foreground font-medium">{ta.reportUnjustified}</th>
                    <th className="text-right px-4 py-2 text-muted-foreground font-medium">{ta.reportNotified}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.map((row) => (
                    <tr key={row.employeeId} className="border-b border-border last:border-0 hover:bg-card/50">
                      <td className="px-4 py-2 text-foreground">{row.employeeName}</td>
                      <td className="px-4 py-2 text-right font-mono">{row.totalAbsences}</td>
                      <td className="px-4 py-2 text-right font-mono text-green-400">{row.justified}</td>
                      <td className="px-4 py-2 text-right font-mono text-red-400">{row.unjustified}</td>
                      <td className="px-4 py-2 text-right font-mono text-yellow-400">{row.notified}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="bg-sidebar border-border">
          <SheetHeader>
            <SheetTitle className="text-foreground">
              {editItem ? ta.editTitle : ta.createTitle}
            </SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-4">
            {!editItem && (
              <FormField name="employeeId" label={ta.employee} error={errors.employeeId?.message}>
                <Select onValueChange={(v) => setValue('employeeId', v)}>
                  <SelectTrigger className={INPUT_CLASS}>
                    <SelectValue placeholder={ta.selectEmployee} />
                  </SelectTrigger>
                  <SelectContent className="bg-overlay border-border">
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            )}
            {!editItem && (
              <FormField name="date" label={ta.date} error={errors.date?.message}>
                <Input type="date" {...register('date')} className={INPUT_CLASS} />
              </FormField>
            )}
            <FormField name="type" label={ta.type} error={errors.type?.message}>
              <Select onValueChange={(v) => setValue('type', v as AbsenceType)} defaultValue="UNJUSTIFIED">
                <SelectTrigger className={INPUT_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-overlay border-border">
                  <SelectItem value="UNJUSTIFIED">{ta.typeUnjustified}</SelectItem>
                  <SelectItem value="JUSTIFIED">{ta.typeJustified}</SelectItem>
                  <SelectItem value="NOTIFIED">{ta.typeNotified}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField name="reason" label={ta.reason} error={errors.reason?.message}>
              <Input {...register('reason')} placeholder={ta.reasonPlaceholder} className={INPUT_CLASS} />
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

      {/* Approve dialog */}
      <ConfirmDialog
        open={!!reviewApprove}
        onOpenChange={(o) => { if (!o) { setReviewApprove(null); setReviewNote(''); } }}
        title={ta.approve}
        description={ta.reviewNote}
        onConfirm={() => handleReview('APPROVED')}
        isLoading={isReviewing}
        confirmLabel={ta.approve}
      />

      {/* Reject dialog */}
      <ConfirmDialog
        open={!!reviewReject}
        onOpenChange={(o) => { if (!o) { setReviewReject(null); setReviewNote(''); } }}
        title={ta.reject}
        description={ta.reviewNote}
        onConfirm={() => handleReview('REJECTED')}
        isLoading={isReviewing}
        confirmLabel={ta.reject}
        variant="danger"
      />

      {/* Delete */}
      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(o) => { if (!o) setDeleteItem(null); }}
        title={ta.deleteTitle}
        description={ta.deleteDesc}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
