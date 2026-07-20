'use client';

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useCustomers, useUpdateCustomerStatus } from '@/lib/api/queries/use-customers';
import type { Customer } from '@/lib/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Avatar, Badge, Button, Drawer, Separator } from '@/components/ui';
import { DataTable, SortableHeader } from '@/components/data-table/data-table';
import { toast } from 'sonner';
import { MapPin } from 'lucide-react';

function CustomerDrawer({ customer, open, onClose }: { customer: Customer | null; open: boolean; onClose: () => void }) {
  if (!customer) return null;
  return (
    <Drawer open={open} onClose={onClose} title={customer.user?.name ?? 'Customer'} width="w-[440px]">
      <div className="p-5 space-y-5">
        <div className="flex items-center gap-3">
          <Avatar name={customer.user?.name} size="lg" />
          <div>
            <p className="font-semibold text-[#111827]">{customer.user?.name ?? '—'}</p>
            <p className="text-sm text-[#6B7280]">{customer.user?.phone}</p>
            {customer.user?.email && <p className="text-sm text-[#6B7280]">{customer.user.email}</p>}
          </div>
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Status', value: <Badge variant={customer.user?.isActive ? 'success' : 'danger'}>{customer.user?.isActive ? 'Active' : 'Blocked'}</Badge> },
            { label: 'Joined', value: formatDate(customer.createdAt) },
            { label: 'Bookings', value: String(customer._count?.bookings ?? 0) },
            { label: 'Addresses', value: String(customer._count?.addresses ?? 0) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] text-[#9CA3AF] uppercase">{label}</p>
              <div className="mt-0.5 text-sm font-medium text-[#111827]">{value}</div>
            </div>
          ))}
        </div>
        {customer.addresses && customer.addresses.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">Saved Addresses</p>
              <div className="space-y-2">
                {customer.addresses.slice(0, 3).map((addr) => (
                  <div key={addr.id} className="flex gap-2 rounded-lg bg-[#F8F8F7] px-3 py-2">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-[#9CA3AF] mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-[#374151]">{addr.label}</p>
                      <p className="text-xs text-[#9CA3AF]">{addr.line1}, {addr.city} {addr.pincode}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}

export default function CustomersPage() {
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(20);
  const [selected, setSelected] = React.useState<Customer | null>(null);
  const { data, isLoading } = useCustomers({ page, limit });
  const updateStatus = useUpdateCustomerStatus();

  const columns: ColumnDef<Customer, unknown>[] = [
    {
      id: 'name',
      header: 'Customer',
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar name={c.user?.name} size="sm" />
            <div>
              <div className="text-sm font-medium text-[#111827]">{c.user?.name ?? '—'}</div>
              <div className="text-xs text-[#9CA3AF]">{c.user?.phone}</div>
            </div>
          </div>
        );
      },
      size: 220,
    },
    {
      id: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-sm text-[#374151]">{row.original.user?.email ?? '—'}</span>
      ),
      size: 200,
    },
    {
      id: 'bookings',
      header: ({ column }) => <SortableHeader column={column}>Bookings</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm font-medium text-[#374151]">{row.original._count?.bookings ?? 0}</span>
      ),
      size: 100,
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.user?.isActive ? 'success' : 'danger'}>
          {row.original.user?.isActive ? 'Active' : 'Blocked'}
        </Badge>
      ),
      size: 100,
    },
    {
      id: 'joined',
      header: 'Joined',
      accessorKey: 'createdAt',
      cell: ({ row }) => (
        <span className="text-xs text-[#9CA3AF]">{formatDate(row.original.createdAt)}</span>
      ),
      size: 110,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                updateStatus.mutate(
                  { userId: c.userId, isActive: !c.user?.isActive },
                  { onSuccess: () => toast.success(c.user?.isActive ? 'Customer blocked' : 'Customer activated') },
                )
              }
            >
              {c.user?.isActive ? 'Block' : 'Activate'}
            </Button>
          </div>
        );
      },
      size: 100,
    },
  ];

  const pageCount = data?.meta ? Math.ceil(data.meta.total / limit) : 1;

  return (
    <div className="space-y-4 fade-in">
      <div>
        <h1 className="text-xl font-bold text-[#111827]">Customers</h1>
        <p className="mt-0.5 text-sm text-[#6B7280]">
          {data?.meta?.total ? `${data.meta.total} registered customers` : 'Loading...'}
        </p>
      </div>
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        searchPlaceholder="Search customers..."
        totalItems={data?.meta?.total}
        page={page}
        pageSize={limit}
        pageCount={pageCount}
        onPageChange={setPage}
        onRowClick={setSelected}
        emptyTitle="No customers found"
      />
      <CustomerDrawer customer={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}
