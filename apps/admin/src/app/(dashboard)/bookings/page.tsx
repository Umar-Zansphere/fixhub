'use client';

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';

import { useBookings } from '@/lib/api/queries/use-bookings';
import type { Booking, BookingStatus } from '@/lib/types';
import { bookingStatusLabel, bookingStatusVariant, formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { Avatar, Badge, Button, Select, Drawer, Skeleton } from '@/components/ui';
import { DataTable, SortableHeader } from '@/components/data-table/data-table';
import { BookingDrawer } from '@/components/bookings/booking-drawer';

const STATUS_OPTIONS = [
  { label: 'All Status', value: '' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Pending Payment', value: 'PENDING_PAYMENT' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Assigned', value: 'ASSIGNED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Failed', value: 'FAILED' },
];

function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge variant={bookingStatusVariant(status)}>
      {bookingStatusLabel(status)}
    </Badge>
  );
}

export default function BookingsPage() {
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(20);
  const [statusFilter, setStatusFilter] = React.useState<BookingStatus | ''>('');
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);

  const { data, isLoading } = useBookings({
    page,
    limit,
    status: statusFilter || undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const columns: ColumnDef<Booking, unknown>[] = [
    {
      id: 'bookingNumber',
      accessorKey: 'bookingNumber',
      header: ({ column }) => <SortableHeader column={column}>Booking ID</SortableHeader>,
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-[#1F2937]">
          {row.original.bookingNumber}
        </span>
      ),
      size: 160,
    },
    {
      id: 'customer',
      header: 'Customer',
      cell: ({ row }) => {
        const name = row.original.customer?.user?.name;
        const phone = row.original.customer?.user?.phone;
        return (
          <div className="flex items-center gap-2.5">
            <Avatar name={name} size="sm" />
            <div>
              <div className="text-xs font-medium text-[#111827]">{name ?? '—'}</div>
              <div className="text-[11px] text-[#9CA3AF]">{phone}</div>
            </div>
          </div>
        );
      },
      size: 200,
    },
    {
      id: 'service',
      header: 'Service',
      cell: ({ row }) => {
        const sub = row.original.subService;
        return (
          <div>
            <div className="text-xs font-medium text-[#111827]">{sub?.name ?? '—'}</div>
            <div className="text-[11px] text-[#9CA3AF]">{sub?.category?.name}</div>
          </div>
        );
      },
      size: 180,
    },
    {
      id: 'technician',
      header: 'Technician',
      cell: ({ row }) => {
        const tech = row.original.technician;
        const name = tech?.user?.name;
        return name ? (
          <div className="flex items-center gap-2">
            <Avatar name={name} size="xs" />
            <span className="text-xs text-[#374151]">{name}</span>
          </div>
        ) : (
          <span className="text-xs text-[#9CA3AF]">Unassigned</span>
        );
      },
      size: 160,
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <BookingStatusBadge status={row.original.status} />,
      size: 130,
    },
    {
      id: 'scheduled',
      header: ({ column }) => <SortableHeader column={column}>Scheduled</SortableHeader>,
      accessorKey: 'scheduledDate',
      cell: ({ row }) => (
        <div>
          <div className="text-xs text-[#374151]">{formatDate(row.original.scheduledDate)}</div>
          <div className="text-[11px] text-[#9CA3AF]">{row.original.scheduledSlot}</div>
        </div>
      ),
      size: 130,
    },
    {
      id: 'amount',
      accessorKey: 'totalAmount',
      header: ({ column }) => <SortableHeader column={column}>Amount</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-[#111827]">
          {formatCurrency(row.original.totalAmount)}
        </span>
      ),
      size: 100,
    },
    {
      id: 'created',
      header: 'Created',
      accessorKey: 'createdAt',
      cell: ({ row }) => (
        <span className="text-xs text-[#9CA3AF]">{formatDate(row.original.createdAt)}</span>
      ),
      size: 110,
    },
  ];

  const pageCount = data?.meta
    ? Math.ceil(data.meta.total / limit)
    : 1;

  return (
    <div className="space-y-4 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Bookings</h1>
          <p className="mt-0.5 text-sm text-[#6B7280]">
            {data?.meta?.total ? `${data.meta.total.toLocaleString()} total bookings` : 'Loading...'}
          </p>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        searchPlaceholder="Search bookings..."
        totalItems={data?.meta?.total}
        page={page}
        pageSize={limit}
        pageCount={pageCount}
        onPageChange={setPage}
        onRowClick={(booking) => setSelectedBooking(booking)}
        emptyTitle="No bookings found"
        emptyDescription="Bookings will appear here once customers start booking services."
        toolbar={
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as BookingStatus | ''); setPage(1); }}
            className="w-[160px]"
            placeholder=""
          />
        }
      />

      {/* Booking Drawer */}
      <BookingDrawer
        booking={selectedBooking}
        open={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />
    </div>
  );
}
