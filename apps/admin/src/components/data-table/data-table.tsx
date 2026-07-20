'use client';

import * as React from 'react';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Settings2, SortAsc, SortDesc } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button, EmptyState, Input, Select, Skeleton } from '@/components/ui';

// ─── Table primitives ─────────────────────────────────────
function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('border-b border-[#E5E7EB]', className)} {...props} />;
}

function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-[#F3F4F6]', className)} {...props} />;
}

function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn('transition-colors hover:bg-[#FAFAF9] cursor-pointer', className)}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'h-10 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]',
        'whitespace-nowrap',
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-4 py-3 text-sm text-[#374151]', className)} {...props} />
  );
}

// ─── Skeleton rows ────────────────────────────────────────
function TableSkeletonRows({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri} className="border-b border-[#F3F4F6]">
          {Array.from({ length: cols }).map((_, ci) => (
            <td key={ci} className="px-4 py-3">
              <Skeleton className={cn('h-4', ci === 0 ? 'w-32' : ci === cols - 1 ? 'w-16' : 'w-24')} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Column sort header ───────────────────────────────────
export function SortableHeader({
  column,
  children,
}: {
  column: { getIsSorted: () => false | 'asc' | 'desc'; toggleSorting: () => void };
  children: React.ReactNode;
}) {
  const sorted = column.getIsSorted();
  return (
    <button
      onClick={() => column.toggleSorting()}
      className="flex items-center gap-1 hover:text-[#374151] transition-colors"
    >
      {children}
      {sorted === 'asc' ? (
        <SortAsc className="h-3 w-3" />
      ) : sorted === 'desc' ? (
        <SortDesc className="h-3 w-3" />
      ) : (
        <ChevronDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );
}

// ─── Main DataTable ───────────────────────────────────────
interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchColumn?: string;
  totalItems?: number;
  page?: number;
  pageSize?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onRowClick?: (row: TData) => void;
  toolbar?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<TData>({
  columns,
  data,
  loading,
  searchPlaceholder = 'Search...',
  searchColumn,
  totalItems,
  page = 1,
  pageSize = 20,
  pageCount = 1,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  toolbar,
  emptyTitle = 'No results',
  emptyDescription,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [colVisOpen, setColVisOpen] = React.useState(false);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: { sorting, columnFilters, columnVisibility, globalFilter },
    manualPagination: !!onPageChange,
    pageCount,
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            leftElement={
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-[220px]"
          />
          {toolbar}
        </div>
        <div className="flex items-center gap-2">
          {totalItems !== undefined && (
            <span className="text-xs text-[#9CA3AF]">{totalItems.toLocaleString()} total</span>
          )}
          {/* Column visibility */}
          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Settings2 className="h-3.5 w-3.5" />}
              onClick={() => setColVisOpen(!colVisOpen)}
            >
              Columns
            </Button>
            {colVisOpen && (
              <div className="absolute right-0 top-10 z-20 min-w-[160px] rounded-lg border border-[#E5E7EB] bg-white p-2 shadow-md">
                {table.getAllColumns()
                  .filter((col) => col.getCanHide())
                  .map((col) => (
                    <label key={col.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#F3F4F6]">
                      <input
                        type="checkbox"
                        checked={col.getIsVisible()}
                        onChange={(e) => col.toggleVisibility(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-xs font-medium capitalize text-[#374151]">
                        {col.id.replace(/_/g, ' ')}
                      </span>
                    </label>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </tr>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeletonRows rows={8} cols={columns.length} />
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {(onPageChange || !loading) && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#9CA3AF]">Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              className="h-7 rounded border border-[#E5E7EB] bg-white px-2 text-xs text-[#374151] focus:outline-none"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <span className="mr-2 text-xs text-[#9CA3AF]">
              Page {page} of {pageCount}
            </span>
            <Button variant="ghost" size="icon" onClick={() => onPageChange?.(1)} disabled={page <= 1} className="h-7 w-7">
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onPageChange?.(page - 1)} disabled={page <= 1} className="h-7 w-7">
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onPageChange?.(page + 1)} disabled={page >= pageCount} className="h-7 w-7">
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onPageChange?.(pageCount)} disabled={page >= pageCount} className="h-7 w-7">
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
