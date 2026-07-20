'use client';

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { AuditLog } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { DataTable, SortableHeader } from '@/components/data-table/data-table';

function ActionBadge({ action }: { action: string }) {
  const variant = action === 'CREATE' ? 'success' : action === 'DELETE' ? 'danger' : 'info';
  return <Badge variant={variant}>{action}</Badge>;
}

export default function AuditLogsPage() {
  const [page, setPage] = React.useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: async () => {
      // Audit logs would be exposed via a dedicated admin endpoint
      // For now returning empty as the endpoint needs to be added to backend
      return { items: [] as AuditLog[], meta: { total: 0, page, limit: 20, totalPages: 1, hasNextPage: false, hasPreviousPage: false } };
    },
  });

  const columns: ColumnDef<AuditLog, unknown>[] = [
    {
      id: 'timestamp',
      header: ({ column }) => <SortableHeader column={column}>Timestamp</SortableHeader>,
      accessorKey: 'createdAt',
      cell: ({ row }) => (
        <span className="text-xs text-[#374151]">{formatDateTime(row.original.createdAt)}</span>
      ),
      size: 160,
    },
    {
      id: 'actor',
      header: 'Actor',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium text-[#111827]">{row.original.user?.name ?? 'System'}</p>
          <p className="text-xs text-[#9CA3AF]">{row.original.user?.phone}</p>
        </div>
      ),
      size: 180,
    },
    {
      id: 'action',
      header: 'Action',
      cell: ({ row }) => <ActionBadge action={row.original.action} />,
      size: 100,
    },
    {
      id: 'entity',
      header: 'Entity',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium text-[#374151]">{row.original.entity}</p>
          <p className="font-mono text-[10px] text-[#9CA3AF]">{row.original.entityId}</p>
        </div>
      ),
      size: 200,
    },
    {
      id: 'ip',
      header: 'IP Address',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-[#6B7280]">{row.original.ipAddress ?? '—'}</span>
      ),
      size: 140,
    },
  ];

  return (
    <div className="space-y-4 fade-in">
      <div>
        <h1 className="text-xl font-bold text-[#111827]">Audit Logs</h1>
        <p className="mt-0.5 text-sm text-[#6B7280]">Immutable record of all platform mutations</p>
      </div>

      <div className="rounded-lg bg-[#FFFBEB] border border-[#FDE68A] px-4 py-3">
        <p className="text-sm text-[#92400E]">
          <strong>Note:</strong> Audit log API endpoint is pending backend implementation. Logs will appear here automatically once the <code>/admin/audit-logs</code> endpoint is added.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        searchPlaceholder="Search audit logs..."
        totalItems={data?.meta?.total}
        page={page}
        pageCount={data?.meta?.totalPages ?? 1}
        onPageChange={setPage}
        emptyTitle="No audit logs"
        emptyDescription="Audit log records will appear here once the backend endpoint is available."
      />
    </div>
  );
}
