'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from '@/lib/utils/toast';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Trash2, Search, Building2, Users, DollarSign } from 'lucide-react';
import { listUnions, deleteUnion, getUnionsDashboard } from '@/lib/api/unions';
import { ROUTES } from '@/lib/constants/routes';
import { useTranslation, useLocaleId } from '@/lib/i18n';
import { PageHeader }    from '@/components/shared/page-header';
import { DataTable }     from '@/components/shared/data-table';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { StatusBadge }   from '@/components/shared/status-badge';
import { StatCard }      from '@/components/shared/stat-card';
import { RoleGate }      from '@/components/shared/role-gate';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { useDebounce }    from '@/lib/hooks/use-debounce';
import { Input } from '@/components/ui/input';
import type { Union, UnionDashboard } from '@/lib/types/union';

const INPUT_CLASS = 'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 focus:border-[#2563EB]/50 focus:ring-0';

function formatDuesValue(union: Union, locale: string): string {
  if (union.duesType === 'PERCENTAGE') {
    return `${union.duesValue}%`;
  }
  const nf = new Intl.NumberFormat(locale, { style: 'currency', currency: 'ARS' });
  return nf.format(union.duesValue);
}

export default function UnionsPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const router = useRouter();
  const { isManager, canEdit, canDelete } = usePermissions();
  const t = useTranslation();
  const localeId = useLocaleId();

  const [unions,      setUnions]      = useState<Union[]>([]);
  const [dashboard,   setDashboard]   = useState<UnionDashboard | null>(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const [search,      setSearch]      = useState('');
  const [page,        setPage]        = useState(1);
  const [total,       setTotal]       = useState(0);
  const [deleteItem,  setDeleteItem]  = useState<Union | null>(null);
  const [isDeleting,  setIsDeleting]  = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const limit = 10;

  const loadDashboard = useCallback(() => {
    if (!companyId) return;
    getUnionsDashboard(companyId)
      .then(setDashboard)
      .catch(() => { /* dashboard is optional, don't block the page */ });
  }, [companyId]);

  const loadUnions = useCallback(() => {
    if (!companyId) return;
    setIsLoading(true);
    listUnions(companyId, { page, limit, search: debouncedSearch || undefined })
      .then((res) => {
        setUnions(res.items);
        setTotal(res.total);
      })
      .catch((err: Error) => toast.error(err.message ?? t.unions.loadError))
      .finally(() => setIsLoading(false));
  }, [companyId, page, debouncedSearch, t.unions.loadError]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useEffect(() => { loadUnions(); }, [loadUnions]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  async function handleDelete() {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      await deleteUnion(companyId, deleteItem.id);
      toast.success(t.unions.deleted);
      setDeleteItem(null);
      loadUnions();
      loadDashboard();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? t.unions.deleteError);
    } finally {
      setIsDeleting(false);
    }
  }

  const nf = new Intl.NumberFormat(localeId, { style: 'currency', currency: 'ARS' });

  const columns: ColumnDef<Union>[] = [
    {
      header: t.unions.colCode,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
          {row.original.code}
        </span>
      ),
    },
    {
      header: t.unions.colName,
      cell: ({ row }) => (
        <span className="text-sm text-white font-medium">{row.original.name}</span>
      ),
    },
    {
      header: t.unions.colDuesType,
      cell: ({ row }) => (
        <span className="text-sm text-slate-300">
          {row.original.duesType === 'PERCENTAGE' ? t.unions.duesPercentage : t.unions.duesFixedAmount}
        </span>
      ),
    },
    {
      header: t.unions.colDuesValue,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-slate-300">
          {formatDuesValue(row.original, localeId)}
        </span>
      ),
    },
    {
      header: t.unions.colMembers,
      cell: ({ row }) => (
        <span className="text-sm text-slate-300 font-mono">
          {row.original.activeMembersCount ?? 0}
        </span>
      ),
    },
    {
      header: t.unions.colStatus,
      cell: ({ row }) => (
        <StatusBadge status={row.original.isActive ? 'active' : 'inactive'} />
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          {canDelete() && (
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteItem(row.original); }}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:outline-none"
              aria-label={t.common.delete}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

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
        title={t.unions.title}
        description={t.unions.description}
        backHref={ROUTES.company(companyId)}
        actions={
          <RoleGate roles={['OWNER', 'ADMIN']}>
            <button
              onClick={() => router.push(ROUTES.newUnion(companyId))}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.unions.newUnion}
            </button>
          </RoleGate>
        }
      />

      {/* Dashboard stat cards */}
      {dashboard && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            title={t.unions.totalActiveUnions}
            value={dashboard.totalActiveUnions}
            icon={<Building2 className="w-4 h-4" />}
          />
          <StatCard
            title={t.unions.totalActiveMembers}
            value={dashboard.totalActiveMembers}
            icon={<Users className="w-4 h-4" />}
          />
          <StatCard
            title={t.unions.estimatedMonthlyCost}
            value={nf.format(dashboard.estimatedMonthlyCost)}
            icon={<DollarSign className="w-4 h-4" />}
          />
        </div>
      )}

      {/* Search */}
      <div className="mb-5">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`${t.common.search}...`}
            className={`${INPUT_CLASS} pl-9`}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={unions}
        total={total}
        page={page}
        limit={limit}
        isLoading={isLoading}
        onPageChange={setPage}
        onRowClick={(row) => router.push(ROUTES.union(companyId, row.id))}
        emptyMessage={t.unions.emptyTitle}
        emptyIcon={<Building2 className="w-6 h-6" />}
        emptyDescription={t.unions.emptyDesc}
        emptyAction={
          canEdit() ? (
            <button
              onClick={() => router.push(ROUTES.newUnion(companyId))}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.unions.newUnion}
            </button>
          ) : undefined
        }
      />

      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => { if (!open) setDeleteItem(null); }}
        onConfirm={handleDelete}
        title={t.unions.deleteTitle}
        description={t.unions.deleteDesc.replace('{name}', deleteItem?.name ?? '')}
        confirmLabel={t.common.delete}
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
