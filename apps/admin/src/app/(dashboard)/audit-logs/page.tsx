'use client';

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
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
      const res = await apiClient.get(endpoints.admin.auditLogs, {
        params: { page, limit: 20 },
      });
      return res.data;
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
