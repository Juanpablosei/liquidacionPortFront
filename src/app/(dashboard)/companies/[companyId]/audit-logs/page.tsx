'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from '@/lib/utils/toast';
import { type ColumnDef } from '@tanstack/react-table';
import { ClipboardList, X } from 'lucide-react';
import { listAuditLogs } from '@/lib/api/audit-logs';
import { ROUTES } from '@/lib/constants/routes';
import { useTranslation, useLocaleId } from '@/lib/i18n';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { Input } from '@/components/ui/input';
import type { AuditLog } from '@/lib/types/audit-log';
import type { PaginatedResponse } from '@/lib/types/api';

const INPUT_CLASS =
  'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 focus:border-[#2563EB]/50 focus:ring-0';

const PAGE_LIMIT = 20;

const ENTITY_OPTIONS = [
  'employees',
  'contracts',
  'members',
  'companies',
  'periods',
  'runs',
  'payslips',
  'concepts',
  'attendance',
  'overtime',
  'holidays',
  'unions',
  'convenio-categories',
  'convenios',
  'settings',
  'terminate',
  'settlement',
  'import',
] as const;

const ACTION_OPTIONS = ['CREATE', 'UPDATE', 'DELETE'] as const;

function formatDateTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ACTION_COLOR: Record<string, 'active' | 'inactive' | 'DRAFT'> = {
  CREATE: 'active',
  UPDATE: 'DRAFT',
  DELETE: 'inactive',
};

export default function AuditLogsPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const t = useTranslation();
  const localeId = useLocaleId();

  const [data, setData] = useState<PaginatedResponse<AuditLog>>({
    items: [],
    total: 0,
    page: 1,
    limit: PAGE_LIMIT,
    pages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filters
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Fetch trigger — bump to re-fetch after filter changes
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const entityLabels = t.auditLogs.entityLabels as Record<string, string>;
  const actionLabels = t.auditLogs.actionLabels as Record<string, string>;

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    setIsLoading(true);
    listAuditLogs(companyId, {
      page,
      limit: PAGE_LIMIT,
      entity: entity || undefined,
      action: action || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: Error) => {
        if (!cancelled) toast.error(err.message ?? t.auditLogs.loadError);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, page, fetchTrigger]);

  function applyFilter(setter: (v: string) => void, value: string) {
    setter(value);
    setPage(1);
    setFetchTrigger((n) => n + 1);
  }

  const hasFilters = entity || action || fromDate || toDate;

  function clearFilters() {
    setEntity('');
    setAction('');
    setFromDate('');
    setToDate('');
    setPage(1);
    setFetchTrigger((n) => n + 1);
  }

  const columns: ColumnDef<AuditLog>[] = [
    {
      header: t.auditLogs.date,
      cell: ({ row }) => (
        <span className="font-mono text-slate-300 text-xs whitespace-nowrap">
          {formatDateTime(row.original.createdAt, localeId)}
        </span>
      ),
    },
    {
      header: t.auditLogs.action,
      cell: ({ row }) => (
        <StatusBadge
          status={ACTION_COLOR[row.original.action] ?? 'DRAFT'}
          label={actionLabels[row.original.action] ?? row.original.action}
        />
      ),
    },
    {
      header: t.auditLogs.entity,
      cell: ({ row }) => (
        <span className="text-sm text-white">
          {entityLabels[row.original.entity] ?? row.original.entity}
        </span>
      ),
    },
    {
      header: t.auditLogs.entityId,
      cell: ({ row }) => (
        <span className="font-mono text-slate-400 text-xs">
          {row.original.entityId
            ? `${row.original.entityId.substring(0, 8)}...`
            : '\u2014'}
        </span>
      ),
    },
    {
      header: t.auditLogs.user,
      cell: ({ row }) => (
        <span className="font-mono text-slate-400 text-xs">
          {row.original.userId.substring(0, 8)}...
        </span>
      ),
    },
    {
      header: t.auditLogs.ip,
      cell: ({ row }) => (
        <span className="font-mono text-slate-500 text-xs">
          {row.original.ip ?? '\u2014'}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t.auditLogs.title}
        description={t.auditLogs.description}
        backHref={ROUTES.company(companyId)}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        {/* Entity filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">{t.auditLogs.filterEntity}</label>
          <select
            value={entity}
            onChange={(e) => applyFilter(setEntity, e.target.value)}
            className={`${INPUT_CLASS} h-9 rounded-lg text-sm px-2 pr-8 min-w-[180px] appearance-none bg-[length:16px] bg-[right_8px_center] bg-no-repeat`}
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
            }}
          >
            <option value="">{t.auditLogs.allEntities}</option>
            {ENTITY_OPTIONS.map((e) => (
              <option key={e} value={e}>
                {entityLabels[e] ?? e}
              </option>
            ))}
          </select>
        </div>

        {/* Action filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">{t.auditLogs.filterAction}</label>
          <select
            value={action}
            onChange={(e) => applyFilter(setAction, e.target.value)}
            className={`${INPUT_CLASS} h-9 rounded-lg text-sm px-2 pr-8 min-w-[150px] appearance-none bg-[length:16px] bg-[right_8px_center] bg-no-repeat`}
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
            }}
          >
            <option value="">{t.auditLogs.allActions}</option>
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {actionLabels[a] ?? a}
              </option>
            ))}
          </select>
        </div>

        {/* Date range */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">{t.auditLogs.fromDate}</label>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => applyFilter(setFromDate, e.target.value)}
            className={`${INPUT_CLASS} h-9 w-[150px]`}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">{t.auditLogs.toDate}</label>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => applyFilter(setToDate, e.target.value)}
            className={`${INPUT_CLASS} h-9 w-[150px]`}
          />
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            {t.auditLogs.clearFilters}
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data.items}
        total={data.total}
        page={data.page}
        limit={data.limit}
        isLoading={isLoading}
        onPageChange={setPage}
        emptyMessage={t.auditLogs.noResults}
        emptyIcon={<ClipboardList className="w-6 h-6" />}
      />
    </>
  );
}
