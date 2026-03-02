'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { type ColumnDef } from '@tanstack/react-table';
import { UserPlus, Search } from 'lucide-react';
import { listEmployees } from '@/lib/api/employees';
import { ROUTES } from '@/lib/constants/routes';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { RoleGate } from '@/components/shared/role-gate';
import { usePermissions } from '@/lib/hooks/use-permissions';
import type { Employee } from '@/lib/types/employee';

const LIMIT = 15;

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  DNI:      'DNI',
  PASSPORT: 'Pasaporte',
  CUIT:     'CUIT',
  CUIL:     'CUIL',
};

export default function EmployeesPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const router         = useRouter();
  const { isManager }  = usePermissions();

  const [employees,  setEmployees]  = useState<Employee[]>([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [inputValue, setInputValue] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('active');
  const [isLoading,  setIsLoading]  = useState(true);

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
      .catch((err: Error) => toast.error(err.message ?? 'Error al cargar empleados'))
      .finally(() => setIsLoading(false));
  }, [companyId, page, search, filterActive]);

  useEffect(() => { load(); }, [load]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(inputValue.trim());
  }

  const columns: ColumnDef<Employee>[] = [
    {
      header: 'Empleado',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-white">
            {row.original.lastName}, {row.original.firstName}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {DOCUMENT_TYPE_LABELS[row.original.documentType] ?? row.original.documentType}{' '}
            {row.original.documentNumber}
          </p>
        </div>
      ),
    },
    {
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-slate-400 text-sm">
          {row.original.email ?? '—'}
        </span>
      ),
    },
    {
      header: 'Ingreso',
      cell: ({ row }) => (
        <span className="font-mono text-slate-300 text-sm">
          {formatDate(row.original.hireDate)}
        </span>
      ),
    },
    {
      header: 'Estado',
      cell: ({ row }) => (
        <StatusBadge status={row.original.isActive ? 'active' : 'inactive'} />
      ),
    },
  ];

  if (!isManager()) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400 text-sm">No tenés permisos para ver esta sección.</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Empleados"
        description="Gestioná el personal de la empresa."
        backHref={ROUTES.company(companyId)}
        actions={
          <RoleGate roles={['OWNER', 'ADMIN']}>
            <Link
              href={ROUTES.newEmployee(companyId)}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo empleado
            </Link>
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
              placeholder="Buscar por nombre o documento..."
              className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#2563EB]/50 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-sm text-slate-300 transition-colors"
          >
            Buscar
          </button>
        </form>

        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilterActive(f); setPage(1); }}
              className={[
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filterActive === f
                  ? 'bg-[#2563EB] text-white'
                  : 'text-slate-400 hover:text-slate-300',
              ].join(' ')}
            >
              {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Inactivos'}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={employees}
        total={total}
        page={page}
        limit={LIMIT}
        isLoading={isLoading}
        onPageChange={setPage}
        onRowClick={(emp) => router.push(ROUTES.employee(companyId, emp.id))}
        emptyMessage="No se encontraron empleados."
      />
    </>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
