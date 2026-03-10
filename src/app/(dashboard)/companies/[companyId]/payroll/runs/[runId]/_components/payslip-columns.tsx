'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { ChevronRight } from 'lucide-react';
import type { Payslip } from '@/lib/types/payroll';

interface ColumnLabels {
  employee: string;
  earnings: string;
  deductions: string;
  net: string;
  viewDetail: string;
}

export function buildPayslipColumns(
  fmt: (v: string | number) => string,
  labels: ColumnLabels,
  onOpenPayslip: (payslip: Payslip) => void,
): ColumnDef<Payslip>[] {
  return [
    {
      header: labels.employee,
      cell: ({ row }) => {
        const e = row.original.employee;
        return (
          <span className="text-sm text-white font-medium">
            {e ? `${e.lastName}, ${e.firstName}` : `${labels.employee} ${row.original.employeeId.slice(-6)}`}
          </span>
        );
      },
    },
    {
      header: labels.earnings,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-emerald-400 whitespace-nowrap">{fmt(row.original.grossPay)}</span>
      ),
    },
    {
      header: labels.deductions,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-red-400 whitespace-nowrap">{fmt(row.original.totalDeductions)}</span>
      ),
    },
    {
      header: labels.net,
      cell: ({ row }) => (
        <span className="font-mono text-sm font-semibold text-white whitespace-nowrap">{fmt(row.original.netPay)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() => onOpenPayslip(row.original)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#93BBFC] transition-colors cursor-pointer"
        >
          {labels.viewDetail}
          <ChevronRight className="w-3 h-3" />
        </button>
      ),
    },
  ];
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
