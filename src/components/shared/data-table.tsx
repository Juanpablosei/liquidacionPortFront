'use client';

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { useTranslation } from '@/lib/i18n';

interface DataTableProps<T> {
  columns:          ColumnDef<T>[];
  data:             T[];
  total:            number;
  page:             number;
  limit:            number;
  isLoading?:       boolean;
  onPageChange:     (page: number) => void;
  onRowClick?:      (row: T) => void;
  emptyMessage?:    string;
  emptyIcon?:       React.ReactNode;
  emptyDescription?: string;
  emptyAction?:     React.ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  total,
  page,
  limit,
  isLoading        = false,
  onPageChange,
  onRowClick,
  emptyMessage,
  emptyIcon,
  emptyDescription,
  emptyAction,
}: DataTableProps<T>) {
  const t = useTranslation();
  const pages = Math.max(1, Math.ceil(total / limit));

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pages,
  });

  return (
    <div className="flex flex-col gap-0">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-border">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-overlay rounded motion-safe:animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyMessage ?? t.dataTable.noData}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(row.original); } } : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? 'button' : undefined}
                  className={[
                    'border-b border-border last:border-0 transition-colors',
                    'even:bg-overlay-subtle',
                    onRowClick ? 'cursor-pointer hover:bg-overlay-subtle focus-visible:bg-overlay-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/50' : '',
                  ].join(' ')}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-muted-foreground">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && total > 0 && (
        <div className="flex items-center justify-between px-1 pt-3">
          <span className="text-xs text-muted-foreground">
            {total} {total === 1 ? t.dataTable.record : t.dataTable.records} · {t.dataTable.pageOf.replace('{page}', String(page)).replace('{pages}', String(pages))}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              aria-label={t.dataTable.prevPage}
              className="w-11 h-11 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-overlay disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pages}
              aria-label={t.dataTable.nextPage}
              className="w-11 h-11 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-overlay disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
