'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { type ColumnDef } from '@tanstack/react-table';
import { UserPlus, Search, Download, Upload, Loader2, AlertTriangle, X } from 'lucide-react';
import { listEmployees, getImportTemplate, importEmployees } from '@/lib/api/employees';
import type { ImportError } from '@/lib/api/employees';
import { ROUTES } from '@/lib/constants/routes';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { RoleGate } from '@/components/shared/role-gate';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { useTranslation, useLocaleId } from '@/lib/i18n';
import type { Employee } from '@/lib/types/employee';

const LIMIT = 15;

export default function EmployeesPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const router         = useRouter();
  const { isManager }  = usePermissions();
  const t              = useTranslation();
  const localeId       = useLocaleId();

  const [employees,  setEmployees]  = useState<Employee[]>([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [inputValue, setInputValue] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('active');
  const [isLoading,  setIsLoading]  = useState(true);

  // Import
  const [downloading, setDownloading] = useState(false);
  const [importing,   setImporting]   = useState(false);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    if (!companyId) return;
    setIsLoading(true);

    const isActiveParam =
      filterActive === 'active'   ? true  :
      filterActive === 'inactive' ? false :
      undefined;

    listEmployees(companyId, { page, limit: LIMIT, search: search || undefined, isActive: isActiveParam })
      .then((res) => {
        setEmployees(res.items);
        setTotal(res.total);
      })
      .catch((err: Error) => toast.error(err.message ?? t.employees.notFound))
      .finally(() => setIsLoading(false));
  }, [companyId, page, search, filterActive, t]);

  useEffect(() => { load(); }, [load]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(inputValue.trim());
  }

  async function handleDownloadTemplate() {
    setDownloading(true);
    try {
      const blob = await getImportTemplate(companyId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employee_import_template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.employees.import.importError);
    } finally {
      setDownloading(false);
    }
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected
    e.target.value = '';

    if (!file.name.endsWith('.xlsx')) {
      toast.error(t.employees.import.invalidFileType);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t.employees.import.fileTooLarge);
      return;
    }

    setImporting(true);
    setImportErrors([]);
    try {
      const result = await importEmployees(companyId, file);
      toast.success(t.employees.import.importSuccess.replace('{count}', String(result.imported)));
      setPage(1);
      load();
    } catch (err: unknown) {
      if (err instanceof Error) {
        // Try to parse row errors from the message
        try {
          const parsed = JSON.parse(err.message);
          if (Array.isArray(parsed)) {
            setImportErrors(parsed as ImportError[]);
          } else {
            toast.error(err.message);
          }
        } catch {
          toast.error(err.message);
        }
      } else {
        toast.error(t.employees.import.importError);
      }
    } finally {
      setImporting(false);
    }
  }

  const docTypeLabels = t.employees.docTypes as Record<string, string>;

  const columns: ColumnDef<Employee>[] = [
    {
      header: t.employees.employee,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-white">
            {row.original.lastName}, {row.original.firstName}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {docTypeLabels[row.original.documentType] ?? row.original.documentType}{' '}
            {row.original.documentNumber}
          </p>
        </div>
      ),
    },
    {
      header: t.employees.email,
      cell: ({ row }) => (
        <span className="text-slate-400 text-sm">
          {row.original.email ?? '\u2014'}
        </span>
      ),
    },
    {
      header: t.employees.hireDate,
      cell: ({ row }) => (
        <span className="font-mono text-slate-300 text-sm">
          {formatDate(row.original.hireDate, localeId)}
        </span>
      ),
    },
    {
      header: t.employees.status,
      cell: ({ row }) => (
        <StatusBadge status={row.original.isActive ? 'active' : 'inactive'} />
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
        title={t.employees.title}
        description={t.employees.description}
        backHref={ROUTES.company(companyId)}
        actions={
          <RoleGate roles={['OWNER', 'ADMIN']}>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleDownloadTemplate}
                disabled={downloading}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-sm text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
              >
                {downloading ? <Loader2 className="w-4 h-4 motion-safe:animate-spin" /> : <Download className="w-4 h-4" />}
                {downloading ? t.employees.import.downloading : t.employees.import.downloadTemplate}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-sm text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
              >
                {importing ? <Loader2 className="w-4 h-4 motion-safe:animate-spin" /> : <Upload className="w-4 h-4" />}
                {importing ? t.employees.import.importing : t.employees.import.importEmployees}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                onChange={handleImportFile}
                className="hidden"
                aria-label={t.employees.import.selectFile}
              />
              <Link
                href={ROUTES.newEmployee(companyId)}
                className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">{t.employees.newEmployee}</span>
                <span className="sm:hidden">{t.employees.newEmployeeShort ?? t.employees.newEmployee}</span>
              </Link>
            </div>
          </RoleGate>
        }
      />

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t.employees.searchPlaceholder}
              aria-label={t.employees.search}
              className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#2563EB]/50 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-sm text-slate-300 transition-colors"
          >
            {t.employees.search}
          </button>
        </form>

        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilterActive(f); setPage(1); }}
              aria-pressed={filterActive === f}
              className={[
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                filterActive === f
                  ? 'bg-[#2563EB] text-white'
                  : 'text-slate-400 hover:text-slate-300',
              ].join(' ')}
            >
              {f === 'all' ? t.employees.all : f === 'active' ? t.employees.actives : t.employees.inactives}
            </button>
          ))}
        </div>
      </div>

      {/* Import errors */}
      {importErrors.length > 0 && (
        <div className="mb-4 bg-red-500/[0.06] border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <p className="text-sm font-medium text-red-400">{t.employees.import.rowErrors}</p>
            </div>
            <button
              onClick={() => setImportErrors([])}
              aria-label={t.common.close}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
            {importErrors.map((err, i) => (
              <p key={i} className="text-xs text-red-300">
                <span className="font-mono text-red-400">Fila {err.row}</span>{' '}
                <span className="text-slate-500">·</span>{' '}
                <span className="text-slate-400">{err.field}:</span>{' '}
                {err.message}
              </p>
            ))}
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={employees}
        total={total}
        page={page}
        limit={LIMIT}
        isLoading={isLoading}
        onPageChange={setPage}
        onRowClick={(emp) => router.push(ROUTES.employee(companyId, emp.id))}
        emptyMessage={t.employees.notFound}
      />
    </>
  );
}

function formatDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}
