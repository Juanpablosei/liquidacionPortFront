'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { toast } from '@/lib/utils/toast';
import { AlertTriangle, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import {
  listIncidents, acknowledgeIncident, dismissIncident, generateAlerts,
} from '@/lib/api/attendance-incidents';
import { useTranslation, useLocaleId } from '@/lib/i18n';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { RoleGate } from '@/components/shared/role-gate';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { listEmployees } from '@/lib/api/employees';
import type { AttendanceIncident, IncidentType, IncidentStatus } from '@/lib/types/attendance';
import type { Employee } from '@/lib/types/employee';

const INPUT_CLASS = 'bg-overlay border-border text-foreground placeholder:text-muted-foreground focus:border-brand/50 focus:ring-0';

function formatDate(d: string, locale: string): string {
  const iso = d.includes('T') ? d : d + 'T00:00:00';
  return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatMinutes(m: number | null): string {
  if (m === null) return '—';
  const h = Math.floor(Math.abs(m) / 60);
  const min = Math.abs(m) % 60;
  const sign = m < 0 ? '-' : '';
  return `${sign}${h}h ${min}m`;
}

export default function AttendanceIncidentsPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { canEdit } = usePermissions();
  const t = useTranslation();
  const ti = t.attendanceIncidents;
  const localeId = useLocaleId();

  const [employees,    setEmployees]    = useState<Employee[]>([]);
  const [incidents,    setIncidents]    = useState<AttendanceIncident[]>([]);
  const [total,        setTotal]        = useState(0);
  const [page,         setPage]         = useState(1);
  const [isLoading,    setIsLoading]    = useState(true);
  const [filterEmp,    setFilterEmp]    = useState('');
  const [filterType,   setFilterType]   = useState<IncidentType | ''>('');
  const [filterStatus, setFilterStatus] = useState<IncidentStatus | ''>('PENDING');
  const [filterFrom,   setFilterFrom]   = useState('');
  const [filterTo,     setFilterTo]     = useState('');
  const [genFrom,      setGenFrom]      = useState('');
  const [genTo,        setGenTo]        = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [processing,   setProcessing]   = useState<string | null>(null);
  const LIMIT = 20;

  const TYPE_LABELS: Record<IncidentType, string> = {
    ABSENCE:                ti.typeAbsence,
    DEFICIT:                ti.typeDeficit,
    SURPLUS:                ti.typeSurplus,
    UNSCHEDULED_ATTENDANCE: ti.typeUnscheduled,
  };
  const STATUS_LABELS: Record<IncidentStatus, string> = {
    PENDING:      ti.statusPending,
    ACKNOWLEDGED: ti.statusAcknowledged,
    DISMISSED:    ti.statusDismissed,
  };

  useEffect(() => {
    listEmployees(companyId, { limit: 100 }).then((r) => setEmployees(r.items)).catch(() => {});
  }, [companyId]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listIncidents(companyId, {
        employeeId: filterEmp || undefined,
        type:       (filterType as IncidentType) || undefined,
        status:     (filterStatus as IncidentStatus) || undefined,
        fromDate:   filterFrom || undefined,
        toDate:     filterTo || undefined,
        page,
        limit:      LIMIT,
      });
      setIncidents(res.items ?? []);
      setTotal(res.total ?? 0);
    } catch {
      toast.error(ti.actionError);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, filterEmp, filterType, filterStatus, filterFrom, filterTo, page, ti.actionError]);

  useEffect(() => { load(); }, [load]);

  async function handleAcknowledge(id: string) {
    setProcessing(id);
    try {
      await acknowledgeIncident(companyId, id);
      toast.success(ti.acknowledged);
      load();
    } catch {
      toast.error(ti.actionError);
    } finally {
      setProcessing(null);
    }
  }

  async function handleDismiss(id: string) {
    setProcessing(id);
    try {
      await dismissIncident(companyId, id);
      toast.success(ti.dismissed);
      load();
    } catch {
      toast.error(ti.actionError);
    } finally {
      setProcessing(null);
    }
  }

  async function handleGenerate() {
    if (!genFrom || !genTo) return;
    setIsGenerating(true);
    try {
      const res = await generateAlerts(companyId, { fromDate: genFrom, toDate: genTo });
      toast.success(`${ti.generated}: ${res.generated}`);
      load();
    } catch {
      toast.error(ti.generateError);
    } finally {
      setIsGenerating(false);
    }
  }

  const columns = useMemo((): ColumnDef<AttendanceIncident>[] => [
    {
      accessorKey: 'employee',
      header: ti.employee,
      cell: ({ row }) => {
        const e = row.original.employee;
        return e ? `${e.firstName} ${e.lastName}` : row.original.employeeId;
      },
    },
    {
      accessorKey: 'date',
      header: ti.date,
      cell: ({ getValue }) => formatDate(getValue<string>(), localeId),
    },
    {
      accessorKey: 'type',
      header: ti.type,
      cell: ({ getValue }) => {
        const v = getValue<IncidentType>();
        const colors: Record<IncidentType, string> = {
          ABSENCE:                'bg-red-500/10 text-red-400',
          DEFICIT:                'bg-orange-500/10 text-orange-400',
          SURPLUS:                'bg-blue-500/10 text-blue-400',
          UNSCHEDULED_ATTENDANCE: 'bg-yellow-500/10 text-yellow-400',
        };
        return (
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${colors[v] ?? ''}`}>
            {TYPE_LABELS[v] ?? v}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ti.status,
      cell: ({ getValue }) => {
        const v = getValue<IncidentStatus>();
        const statusColors: Record<IncidentStatus, string> = {
          PENDING:      'bg-yellow-500/10 text-yellow-400',
          ACKNOWLEDGED: 'bg-emerald-500/10 text-emerald-400',
          DISMISSED:    'bg-slate-500/10 text-muted-foreground',
        };
        return (
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusColors[v] ?? ''}`}>
            {STATUS_LABELS[v] ?? v}
          </span>
        );
      },
    },
    {
      accessorKey: 'deltaMinutes',
      header: ti.delta,
      cell: ({ getValue }) => {
        const v = getValue<number | null>();
        if (v === null) return '—';
        const cls = v < 0 ? 'text-red-400' : v > 0 ? 'text-blue-400' : 'text-muted-foreground';
        return <span className={`font-mono text-xs ${cls}`}>{formatMinutes(v)}</span>;
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        if (!canEdit()) return null;
        const inc = row.original;
        if (inc.status !== 'PENDING') return null;
        const busy = processing === inc.id;
        return (
          <div className="flex gap-1 justify-end">
            <Button
              variant="ghost" size="sm"
              disabled={busy}
              onClick={() => handleAcknowledge(inc.id)}
              className="h-7 gap-1 text-xs text-green-400 hover:text-green-400 hover:bg-green-500/[0.08] cursor-pointer"
            >
              <CheckCircle2 className="w-3 h-3" />
              {ti.acknowledge}
            </Button>
            <Button
              variant="ghost" size="sm"
              disabled={busy}
              onClick={() => handleDismiss(inc.id)}
              className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <XCircle className="w-3 h-3" />
              {ti.dismiss}
            </Button>
          </div>
        );
      },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [ti, localeId, processing, canEdit]);

  return (
    <div className="space-y-6">
      <PageHeader title={ti.title} description={ti.description} />

      {/* Generate alerts */}
      <RoleGate roles={['OWNER', 'ADMIN', 'MANAGER']}>
        <div className="rounded-xl bg-card border border-border p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">{ti.generate}</p>
          <p className="text-xs text-muted-foreground">{ti.generateDesc}</p>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{ti.fromDate}</span>
              <Input type="date" value={genFrom} onChange={(e) => setGenFrom(e.target.value)} className={`${INPUT_CLASS} w-40`} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{ti.toDate}</span>
              <Input type="date" value={genTo} onChange={(e) => setGenTo(e.target.value)} className={`${INPUT_CLASS} w-40`} />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !genFrom || !genTo}
              size="sm"
              className="gap-2 bg-brand hover:bg-brand/90 text-white cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? ti.generating : ti.generate}
            </Button>
          </div>
        </div>
      </RoleGate>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterEmp} onValueChange={(v) => { setFilterEmp(v === '__all__' ? '' : v); setPage(1); }}>
          <SelectTrigger className={`${INPUT_CLASS} w-48`}>
            <SelectValue placeholder={ti.allEmployees} />
          </SelectTrigger>
          <SelectContent className="bg-overlay border-border">
            <SelectItem value="__all__">{ti.allEmployees}</SelectItem>
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={(v) => { setFilterType(v === '__all__' ? '' : v as IncidentType); setPage(1); }}>
          <SelectTrigger className={`${INPUT_CLASS} w-44`}>
            <SelectValue placeholder={ti.allTypes} />
          </SelectTrigger>
          <SelectContent className="bg-overlay border-border">
            <SelectItem value="__all__">{ti.allTypes}</SelectItem>
            <SelectItem value="ABSENCE">{ti.typeAbsence}</SelectItem>
            <SelectItem value="DEFICIT">{ti.typeDeficit}</SelectItem>
            <SelectItem value="SURPLUS">{ti.typeSurplus}</SelectItem>
            <SelectItem value="UNSCHEDULED_ATTENDANCE">{ti.typeUnscheduled}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v === '__all__' ? '' : v as IncidentStatus); setPage(1); }}>
          <SelectTrigger className={`${INPUT_CLASS} w-40`}>
            <SelectValue placeholder={ti.allStatuses} />
          </SelectTrigger>
          <SelectContent className="bg-overlay border-border">
            <SelectItem value="__all__">{ti.allStatuses}</SelectItem>
            <SelectItem value="PENDING">{ti.statusPending}</SelectItem>
            <SelectItem value="ACKNOWLEDGED">{ti.statusAcknowledged}</SelectItem>
            <SelectItem value="DISMISSED">{ti.statusDismissed}</SelectItem>
          </SelectContent>
        </Select>

        <Input type="date" value={filterFrom} onChange={(e) => { setFilterFrom(e.target.value); setPage(1); }} className={`${INPUT_CLASS} w-40`} />
        <Input type="date" value={filterTo} onChange={(e) => { setFilterTo(e.target.value); setPage(1); }} className={`${INPUT_CLASS} w-40`} />
      </div>

      {incidents.length === 0 && !isLoading ? (
        <EmptyState
          icon={<AlertTriangle className="w-8 h-8 text-muted-foreground" />}
          title={ti.emptyTitle}
          description={ti.emptyDesc}
        />
      ) : (
        <DataTable
          columns={columns}
          data={incidents}
          total={total}
          page={page}
          limit={LIMIT}
          onPageChange={setPage}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
