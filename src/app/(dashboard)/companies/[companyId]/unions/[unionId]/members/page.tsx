'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/utils/toast';
import { Users, UserPlus, UserMinus } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { getUnion, listUnionMembers, addUnionMember, removeUnionMember } from '@/lib/api/unions';
import { listEmployees } from '@/lib/api/employees';
import { addMemberSchema, type AddMemberInput } from '@/lib/validators/union';
import { ROUTES } from '@/lib/constants/routes';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { RoleGate } from '@/components/shared/role-gate';
import { FormField } from '@/components/shared/form-field';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { useTranslation } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Union, UnionMembership } from '@/lib/types/union';
import type { Employee } from '@/lib/types/employee';

export default function UnionMembersPage() {
  const { companyId, unionId } = useParams<{ companyId: string; unionId: string }>();
  const { canEdit } = usePermissions();
  const t = useTranslation();

  const [union, setUnion] = useState<Union | null>(null);
  const [members, setMembers] = useState<UnionMembership[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOnly, setActiveOnly] = useState(true);

  // Add member dialog
  const [showAdd, setShowAdd] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [addingMember, setAddingMember] = useState(false);

  // Remove member dialog
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeDate, setRemoveDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [removingMember, setRemovingMember] = useState(false);

  const limit = 10;

  const loadMembers = useCallback(async () => {
    if (!companyId || !unionId) return;
    setIsLoading(true);
    try {
      const res = await listUnionMembers(companyId, unionId, { page, limit, activeOnly });
      setMembers(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.unions.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, unionId, page, limit, activeOnly, t]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  useEffect(() => {
    if (!companyId || !unionId) return;
    getUnion(companyId, unionId)
      .then(setUnion)
      .catch(() => {});
  }, [companyId, unionId]);

  // Load employees for the add member selector
  useEffect(() => {
    if (!showAdd || !companyId) return;
    listEmployees(companyId, { limit: 100, isActive: true })
      .then((res) => setEmployees(res.items))
      .catch(() => {});
  }, [showAdd, companyId]);

  const addForm = useForm<AddMemberInput>({
    resolver: zodResolver(addMemberSchema(t.validators)),
    defaultValues: { employeeId: '', startDate: new Date().toISOString().slice(0, 10) },
  });

  async function onAddMember(data: AddMemberInput) {
    setAddingMember(true);
    try {
      await addUnionMember(companyId, unionId, data);
      toast.success(t.unions.memberAdded);
      setShowAdd(false);
      addForm.reset({ employeeId: '', startDate: new Date().toISOString().slice(0, 10) });
      loadMembers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.unions.memberAddError);
    } finally {
      setAddingMember(false);
    }
  }

  async function onRemoveMember() {
    if (!removingId) return;
    setRemovingMember(true);
    try {
      await removeUnionMember(companyId, unionId, removingId, { endDate: removeDate });
      toast.success(t.unions.memberRemoved);
      setRemovingId(null);
      loadMembers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.unions.memberRemoveError);
    } finally {
      setRemovingMember(false);
    }
  }

  const columns = useMemo<ColumnDef<UnionMembership>[]>(() => {
    const cols: ColumnDef<UnionMembership>[] = [
      {
        accessorKey: 'employee',
        header: t.common.name,
        cell: ({ row }) => {
          const emp = row.original.employee;
          return emp ? `${emp.lastName}, ${emp.firstName}` : '—';
        },
      },
      {
        accessorKey: 'documentNumber',
        header: t.unions.code,
        cell: ({ row }) => row.original.employee?.documentNumber ?? '—',
      },
      {
        accessorKey: 'startDate',
        header: t.unions.startDate,
        cell: ({ row }) => row.original.startDate.slice(0, 10),
      },
      {
        accessorKey: 'endDate',
        header: t.unions.endDate,
        cell: ({ row }) => row.original.endDate?.slice(0, 10) ?? '—',
      },
      {
        accessorKey: 'status',
        header: t.common.status,
        cell: ({ row }) => {
          const isActive = !row.original.endDate || new Date(row.original.endDate) >= new Date();
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
              isActive
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/15 text-red-400 border-red-500/20'
            }`}>
              {isActive ? t.common.active : t.common.inactive}
            </span>
          );
        },
      },
    ];

    if (canEdit()) {
      cols.push({
        id: 'actions',
        header: t.common.actions,
        cell: ({ row }) => {
          const isActive = !row.original.endDate || new Date(row.original.endDate) >= new Date();
          if (!isActive) return null;
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRemovingId(row.original.id);
                setRemoveDate(new Date().toISOString().slice(0, 10));
              }}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <UserMinus className="w-3.5 h-3.5" />
              {t.unions.removeMember}
            </button>
          );
        },
      });
    }

    return cols;
  }, [t, canEdit]);

  return (
    <>
      <PageHeader
        title={union ? `${t.unions.membersTitle} — ${union.name}` : t.unions.membersTitle}
        description={union?.code}
        backHref={ROUTES.union(companyId, unionId)}
        actions={
          <RoleGate roles={['OWNER', 'ADMIN']}>
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand/90 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              {t.unions.addMember}
            </button>
          </RoleGate>
        }
      />

      {/* Active only filter */}
      <div className="mb-4">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => { setActiveOnly(e.target.checked); setPage(1); }}
            className="h-4 w-4 rounded border-border bg-overlay-subtle text-brand focus:ring-brand/50"
          />
          <span className="text-sm text-muted-foreground">{t.unions.filterActive}</span>
        </label>
      </div>

      <DataTable
        columns={columns}
        data={members}
        total={total}
        page={page}
        limit={limit}
        isLoading={isLoading}
        onPageChange={setPage}
        emptyMessage={t.unions.noMembers}
        emptyDescription={t.unions.noMembersDesc}
        emptyIcon={<Users className="w-10 h-10 text-muted-foreground" />}
      />

      {/* Add member dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.unions.addMember}</DialogTitle>
            <DialogDescription>{t.unions.selectEmployee}</DialogDescription>
          </DialogHeader>
          <form onSubmit={addForm.handleSubmit(onAddMember)} className="space-y-4">
            <FormField
              label={t.unions.selectEmployee}
              name="employeeId"
              error={addForm.formState.errors.employeeId?.message}
              required
            >
              <Controller
                control={addForm.control}
                name="employeeId"
                render={({ field }) => (
                  <select
                    value={field.value}
                    onChange={field.onChange}
                    className="flex h-10 w-full rounded-md border border-border bg-overlay-subtle px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
                  >
                    <option value="">{t.unions.selectEmployee}</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.lastName}, {emp.firstName} — {emp.documentNumber}
                      </option>
                    ))}
                  </select>
                )}
              />
            </FormField>

            <FormField
              label={t.unions.startDate}
              name="startDate"
              error={addForm.formState.errors.startDate?.message}
              required
            >
              <Input {...addForm.register('startDate')} type="date" />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 bg-overlay hover:bg-overlay-strong border border-border text-sm text-muted-foreground rounded-xl transition-colors cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={addingMember}
                className="px-4 py-2 bg-brand hover:bg-brand/90 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {addingMember ? t.common.saving : t.common.save}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove member dialog */}
      <Dialog open={removingId !== null} onOpenChange={(open) => { if (!open) setRemovingId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.unions.removeMember}</DialogTitle>
            <DialogDescription>{t.unions.endDate}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label={t.unions.endDate} name="endDate">
              <Input
                type="date"
                value={removeDate}
                onChange={(e) => setRemoveDate(e.target.value)}
              />
            </FormField>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRemovingId(null)}
                className="px-4 py-2 bg-overlay hover:bg-overlay-strong border border-border text-sm text-muted-foreground rounded-xl transition-colors cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={onRemoveMember}
                disabled={removingMember}
                className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 text-sm text-red-400 font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {removingMember ? t.common.processing : t.unions.removeMember}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
