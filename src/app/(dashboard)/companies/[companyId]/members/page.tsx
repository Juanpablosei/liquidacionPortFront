'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/utils/toast';
import { Plus, UserMinus, ChevronDown, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { usePermissions } from '@/lib/hooks/use-permissions';
import {
  listMembers,
  addMember,
  updateMember,
  removeMember,
  transferOwnership,
} from '@/lib/api/companies';
import { addMemberSchema, type AddMemberInput } from '@/lib/validators/company';
import { ROUTES } from '@/lib/constants/routes';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { RoleGate } from '@/components/shared/role-gate';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { FormField } from '@/components/shared/form-field';
import { EmptyState } from '@/components/shared/empty-state';
import { Input } from '@/components/ui/input';
import { useTranslation, useLocaleId } from '@/lib/i18n';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CompanyUser, CompanyRole } from '@/lib/types/company';

function getInitials(name?: string | null, email?: string | null): string {
  if (name) return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return email?.[0]?.toUpperCase() ?? '?';
}

export default function MembersPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { user }      = useAuthStore();
  const { isAdmin, isOwner } = usePermissions();
  const t = useTranslation();
  const localeId = useLocaleId();

  const ROLE_LABELS: Record<CompanyRole, string> = {
    OWNER:   t.members.owner,
    ADMIN:   t.members.admin,
    MANAGER: t.members.manager,
    MEMBER:  t.members.memberRole,
  };

  const ASSIGNABLE_ROLES: { value: CompanyRole; label: string }[] = [
    { value: 'ADMIN',   label: t.members.admin },
    { value: 'MANAGER', label: t.members.manager },
    { value: 'MEMBER',  label: t.members.memberRole },
  ];

  const [members,   setMembers]   = useState<CompanyUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [addOpen,    setAddOpen]    = useState(false);
  const [removeTarget, setRemoveTarget] = useState<CompanyUser | null>(null);
  const [transferTarget, setTransferTarget] = useState<CompanyUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function fetchMembers() {
    try {
      const data = await listMembers(companyId);
      setMembers(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.members.removeError);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { fetchMembers(); }, [companyId]);

  async function handleChangeRole(memberId: string, role: CompanyRole) {
    try {
      await updateMember(companyId, memberId, { role });
      toast.success(t.members.roleUpdated);
      fetchMembers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.members.roleError);
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setActionLoading(true);
    try {
      await removeMember(companyId, removeTarget.userId);
      toast.success(t.members.memberRemoved);
      setRemoveTarget(null);
      fetchMembers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.members.removeError);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleTransfer() {
    if (!transferTarget) return;
    setActionLoading(true);
    try {
      await transferOwnership(companyId, transferTarget.userId);
      toast.success(t.members.transferred);
      setTransferTarget(null);
      fetchMembers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.members.transferError);
    } finally {
      setActionLoading(false);
    }
  }

  const memberList = Array.isArray(members) ? members : [];
  const currentUserRole = memberList.find((m) => m.userId === user?.id)?.role;

  return (
    <>
      <PageHeader
        title={t.members.title}
        description={t.members.description}
        backHref={ROUTES.company(companyId)}
        actions={
          <RoleGate roles={['OWNER', 'ADMIN']}>
            <button
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.members.addMember}
            </button>
          </RoleGate>
        }
      />

      {isLoading ? (
        <MembersSkeleton />
      ) : memberList.length === 0 ? (
        <EmptyState title={t.members.emptyTitle} description={t.members.emptyDesc} />
      ) : (
        <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">{t.members.member}</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 hidden sm:table-cell">{t.members.role}</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 hidden md:table-cell">{t.members.since}</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {memberList.map((member) => {
                const isCurrentUser = member.userId === user?.id;
                const isOwnerRow    = member.role === 'OWNER';
                const canModify     = isAdmin() && !isOwnerRow && !isCurrentUser;

                return (
                  <tr key={member.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.04] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#2563EB]/15 flex items-center justify-center text-xs font-semibold text-[#93BBFC] shrink-0">
                          {getInitials(member.name, member.email)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">
                            {member.name ?? member.email ?? member.userId}
                            {isCurrentUser && <span className="ml-2 text-[11px] text-slate-500">{t.members.you}</span>}
                          </p>
                          {member.name && member.email && (
                            <p className="text-xs text-slate-500 truncate">{member.email}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 hidden sm:table-cell">
                      {canModify ? (
                        <RoleSelector
                          currentRole={member.role}
                          onChange={(r) => handleChangeRole(member.userId, r)}
                          assignableRoles={ASSIGNABLE_ROLES}
                        />
                      ) : (
                        <StatusBadge status={member.role} />
                      )}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-500 hidden md:table-cell">
                      {new Date(member.joinedAt).toLocaleDateString(localeId, {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>

                    <td className="px-4 py-4">
                      {canModify && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer" aria-label={t.members.options}>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-[#0F172A] border border-white/[0.08]" align="end">
                            {isOwner() && !isOwnerRow && (
                              <DropdownMenuItem
                                onClick={() => setTransferTarget(member)}
                                className="text-yellow-400 focus:text-yellow-300 focus:bg-yellow-500/10 cursor-pointer"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 mr-2" />
                                {t.members.transferOption}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setRemoveTarget(member)}
                              className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
                            >
                              <UserMinus className="w-3.5 h-3.5 mr-2" />
                              {t.members.removeOption}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add member modal */}
      <AddMemberDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        companyId={companyId}
        onSuccess={() => { setAddOpen(false); fetchMembers(); }}
      />

      {/* Remove confirm */}
      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(o) => { if (!o) setRemoveTarget(null); }}
        onConfirm={handleRemove}
        title={t.members.removeTitle}
        description={t.members.removeDesc.replace('{name}', removeTarget?.name ?? removeTarget?.email ?? t.members.member)}
        confirmLabel={t.members.removeLabel}
        variant="warning"
        isLoading={actionLoading}
      />

      {/* Transfer ownership confirm */}
      <ConfirmDialog
        open={!!transferTarget}
        onOpenChange={(o) => { if (!o) setTransferTarget(null); }}
        onConfirm={handleTransfer}
        title={t.members.transferTitle}
        description={t.members.transferDesc.replace('{name}', transferTarget?.name ?? transferTarget?.email ?? t.members.member)}
        confirmLabel={t.members.transferLabel}
        variant="danger"
        isLoading={actionLoading}
      />
    </>
  );
}

function RoleSelector({
  currentRole,
  onChange,
  assignableRoles,
}: {
  currentRole: CompanyRole;
  onChange:    (role: CompanyRole) => void;
  assignableRoles: { value: CompanyRole; label: string }[];
}) {
  return (
    <Select value={currentRole} onValueChange={(v) => onChange(v as CompanyRole)}>
      <SelectTrigger className="w-32 h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-[#0F172A] border border-white/[0.08]">
        {assignableRoles.map((r) => (
          <SelectItem key={r.value} value={r.value} className="text-white focus:bg-white/[0.05]">
            {r.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AddMemberDialog({
  open,
  onOpenChange,
  companyId,
  onSuccess,
}: {
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  companyId:     string;
  onSuccess:     () => void;
}) {
  const t = useTranslation();
  const [loading, setLoading] = useState(false);

  const ASSIGNABLE_ROLES: { value: CompanyRole; label: string }[] = [
    { value: 'ADMIN',   label: t.members.admin },
    { value: 'MANAGER', label: t.members.manager },
    { value: 'MEMBER',  label: t.members.memberRole },
  ];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddMemberInput>({
    resolver: zodResolver(addMemberSchema(t.validators)),
    defaultValues: { role: 'MEMBER' },
  });

  const selectedRole = watch('role');

  async function onSubmit(data: AddMemberInput) {
    setLoading(true);
    try {
      await addMember(companyId, data);
      toast.success(t.members.memberAdded);
      reset();
      onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.members.addError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="bg-[#0F172A] border border-white/[0.08] text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">{t.members.addMember}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-1">
          <FormField label={t.members.userId} name="userId" error={errors.userId?.message} required>
            <Input
              {...register('userId')}
              placeholder={t.members.userIdPlaceholder}
              className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 font-mono text-xs"
            />
          </FormField>

          <FormField label={t.members.role} name="role" error={errors.role?.message} required>
            <Select value={selectedRole} onValueChange={(v) => setValue('role', v as Exclude<CompanyRole, 'OWNER'>)}>
              <SelectTrigger className="bg-white/[0.05] border-white/[0.1] text-white">
                <SelectValue placeholder={t.members.selectRole} />
              </SelectTrigger>
              <SelectContent className="bg-[#0F172A] border border-white/[0.08]">
                {ASSIGNABLE_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="text-white focus:bg-white/[0.05]">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-medium transition-colors mt-1"
          >
            {loading ? t.members.adding : t.members.addMember}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MembersSkeleton() {
  return (
    <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl overflow-hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.04] last:border-0 motion-safe:animate-pulse">
          <div className="w-8 h-8 rounded-full bg-white/[0.06]" />
          <div className="flex-1">
            <div className="h-4 bg-white/[0.06] rounded w-36 mb-1.5" />
            <div className="h-3 bg-white/[0.04] rounded w-48" />
          </div>
          <div className="h-6 bg-white/[0.04] rounded w-20 hidden sm:block" />
        </div>
      ))}
    </div>
  );
}
