'use client';

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { useBookings } from '@/lib/api/queries/use-bookings';
import type { Booking } from '@/lib/types';
import { formatCurrency, formatDateTime, paymentStatusVariant } from '@/lib/utils';
import { Badge, Button, Tabs } from '@/components/ui';
import { DataTable, SortableHeader } from '@/components/data-table/data-table';

export default function PaymentsPage() {
  const [tab, setTab] = React.useState('all');
  const [page, setPage] = React.useState(1);

  // Payments are fetched via bookings that have payment data
  const { data, isLoading } = useBookings({ page, limit: 20 });

  const bookingsWithPayments = (data?.items ?? []).filter((b) => b.payment);

  const columns: ColumnDef<Booking, unknown>[] = [
    {
      id: 'bookingNumber',
      header: 'Booking',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-[#1F2937]">{row.original.bookingNumber}</span>
      ),
      size: 160,
    },
    {
      id: 'customer',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium text-[#111827]">{row.original.customer?.user?.name ?? '—'}</p>
          <p className="text-xs text-[#9CA3AF]">{row.original.customer?.user?.phone}</p>
        </div>
      ),
      size: 180,
    },
    {
      id: 'amount',
      header: ({ column }) => <SortableHeader column={column}>Amount</SortableHeader>,
      accessorFn: (row) => row.payment?.amount,
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-[#111827]">
          {row.original.payment ? formatCurrency(row.original.payment.amount) : '—'}
        </span>
      ),
      size: 120,
    },
    {
      id: 'method',
      header: 'Method',
      cell: ({ row }) => (
        <span className="text-sm text-[#374151]">{row.original.payment?.method ?? '—'}</span>
      ),
      size: 110,
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const ps = row.original.payment?.status;
        return ps ? (
          <Badge variant={paymentStatusVariant(ps as any)}>{ps}</Badge>
        ) : <span className="text-xs text-[#9CA3AF]">No payment</span>;
      },
      size: 130,
    },
    {
      id: 'gatewayId',
      header: 'Gateway ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-[#6B7280]">
          {row.original.payment?.razorpayPaymentId ?? '—'}
        </span>
      ),
      size: 200,
    },
    {
      id: 'date',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-xs text-[#9CA3AF]">
          {row.original.payment?.paidAt ? formatDateTime(row.original.payment.paidAt) : formatDateTime(row.original.createdAt)}
        </span>
      ),
      size: 150,
    },
  ];

  const pageCount = data?.meta ? Math.ceil(data.meta.total / 20) : 1;

  return (
    <div className="space-y-4 fade-in">
      <div>
        <h1 className="text-xl font-bold text-[#111827]">Payments</h1>
        <p className="mt-0.5 text-sm text-[#6B7280]">Transaction and refund management</p>
      </div>

      <Tabs
        tabs={[
          { id: 'all', label: 'All Transactions' },
          { id: 'captured', label: 'Captured' },
          { id: 'failed', label: 'Failed' },
          { id: 'refunded', label: 'Refunded' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        searchPlaceholder="Search transactions..."
        totalItems={data?.meta?.total}
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
        emptyTitle="No transactions"
        emptyDescription="Payment transactions will appear here."
      />
    </div>
  );
}
