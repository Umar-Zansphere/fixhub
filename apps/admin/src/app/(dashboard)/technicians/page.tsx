'use client';

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { Shield, ShieldCheck, ShieldX } from 'lucide-react';

import { useTechnicians, useUpdateTechnicianStatus, useVerifyTechnician } from '@/lib/api/queries/use-technicians';
import type { Technician, VerificationStatus } from '@/lib/types';
import { formatDate, verificationStatusVariant } from '@/lib/utils';
import { Avatar, Badge, Button, Select } from '@/components/ui';
import { DataTable, SortableHeader } from '@/components/data-table/data-table';
import { toast } from 'sonner';

const VERIFICATION_OPTIONS = [
  { label: 'All Verification', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
  { label: 'Verified', value: 'VERIFIED' },
  { label: 'Rejected', value: 'REJECTED' },
];

const AVAILABILITY_OPTIONS = [
  { label: 'All Availability', value: '' },
  { label: 'Available', value: 'true' },
  { label: 'Unavailable', value: 'false' },
];

function VerificationBadge({ status }: { status: VerificationStatus }) {
  const icons: Record<VerificationStatus, React.ReactNode> = {
    PENDING: <Shield className="h-3 w-3" />,
    UNDER_REVIEW: <Shield className="h-3 w-3" />,
    VERIFIED: <ShieldCheck className="h-3 w-3" />,
    REJECTED: <ShieldX className="h-3 w-3" />,
  };
  const labels: Record<VerificationStatus, string> = {
    PENDING: 'Pending',
    UNDER_REVIEW: 'Under Review',
    VERIFIED: 'Verified',
    REJECTED: 'Rejected',
  };
  return (
    <Badge variant={verificationStatusVariant(status)}>
      {icons[status]} {labels[status]}
    </Badge>
  );
}

function StarRating({ rating }: { rating: number | string }) {
  const r = Number(rating);
  return (
    <div className="flex items-center gap-1">
      <span className="text-[#F59E0B]">★</span>
      <span className="text-xs font-medium text-[#374151]">{r.toFixed(1)}</span>
    </div>
  );
}

export default function TechniciansPage() {
  const router = useRouter();
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(20);
  const [verificationFilter, setVerificationFilter] = React.useState('');
  const [availabilityFilter, setAvailabilityFilter] = React.useState('');

  const { data, isLoading } = useTechnicians({
    page,
    limit,
    verificationStatus: verificationFilter as VerificationStatus | undefined || undefined,
    isAvailable: availabilityFilter === '' ? undefined : availabilityFilter === 'true',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const updateStatus = useUpdateTechnicianStatus();
  const verifyTech = useVerifyTechnician();

  const columns: ColumnDef<Technician, unknown>[] = [
    {
      id: 'name',
      header: 'Technician',
      cell: ({ row }) => {
        const t = row.original;
        const name = t.user?.name;
        return (
          <div className="flex items-center gap-3">
            <Avatar name={name} src={t.profilePictureUrl} size="md" />
            <div>
              <div className="text-sm font-semibold text-[#111827]">{name ?? '—'}</div>
              <div className="text-xs text-[#9CA3AF]">{t.user?.phone}</div>
            </div>
          </div>
        );
      },
      size: 220,
    },
    {
      id: 'verification',
      header: 'Verification',
      cell: ({ row }) => <VerificationBadge status={row.original.verificationStatus} />,
      size: 140,
    },
    {
      id: 'availability',
      header: 'Availability',
      cell: ({ row }) => (
        <Badge variant={row.original.isAvailable ? 'success' : 'neutral'}>
          {row.original.isAvailable ? 'Available' : 'Offline'}
        </Badge>
      ),
      size: 110,
    },
    {
      id: 'rating',
      header: ({ column }) => <SortableHeader column={column}>Rating</SortableHeader>,
      accessorKey: 'rating',
      cell: ({ row }) => <StarRating rating={row.original.rating} />,
      size: 90,
    },
    {
      id: 'jobs',
      header: ({ column }) => <SortableHeader column={column}>Jobs</SortableHeader>,
      accessorKey: 'totalJobs',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-[#374151]">{row.original.totalJobs}</span>
      ),
      size: 80,
    },
    {
      id: 'areas',
      header: 'Areas',
      cell: ({ row }) => {
        const areas = row.original.serviceAreas?.slice(0, 2) ?? [];
        const extra = (row.original.serviceAreas?.length ?? 0) - 2;
        return (
          <div className="flex flex-wrap gap-1">
            {areas.map((a) => (
              <span key={a.serviceArea.id} className="rounded bg-[#F3F4F6] px-1.5 py-0.5 text-[10px] text-[#6B7280]">
                {a.serviceArea.name}
              </span>
            ))}
            {extra > 0 && (
              <span className="rounded bg-[#F3F4F6] px-1.5 py-0.5 text-[10px] text-[#9CA3AF]">+{extra}</span>
            )}
          </div>
        );
      },
      size: 180,
    },
    {
      id: 'status',
      header: 'Account',
      cell: ({ row }) => (
        <Badge variant={row.original.user?.isActive ? 'success' : 'danger'}>
          {row.original.user?.isActive ? 'Active' : 'Suspended'}
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
        const t = row.original;
        return (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            {t.verificationStatus === 'PENDING' || t.verificationStatus === 'UNDER_REVIEW' ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  verifyTech.mutate({ id: t.id, status: 'VERIFIED' }, {
                    onSuccess: () => toast.success(`${t.user?.name} verified`),
                  })
                }
                loading={verifyTech.isPending}
              >
                Verify
              </Button>
            ) : null}
            <Button
              size="sm"
              variant={t.user?.isActive ? 'ghost' : 'secondary'}
              onClick={() =>
                updateStatus.mutate({ userId: t.userId, isActive: !t.user?.isActive }, {
                  onSuccess: () =>
                    toast.success(`Account ${t.user?.isActive ? 'suspended' : 'activated'}`),
                })
              }
            >
              {t.user?.isActive ? 'Suspend' : 'Activate'}
            </Button>
          </div>
        );
      },
      size: 150,
    },
  ];

  const pageCount = data?.meta ? Math.ceil(data.meta.total / limit) : 1;

  return (
    <div className="space-y-4 fade-in">
      <div>
        <h1 className="text-xl font-bold text-[#111827]">Technicians</h1>
        <p className="mt-0.5 text-sm text-[#6B7280]">
          {data?.meta?.total ? `${data.meta.total} technicians on platform` : 'Loading...'}
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        searchPlaceholder="Search technicians..."
        totalItems={data?.meta?.total}
        page={page}
        pageSize={limit}
        pageCount={pageCount}
        onPageChange={setPage}
        onRowClick={(tech) => router.push(`/technicians/${tech.id}`)}
        emptyTitle="No technicians found"
        emptyDescription="Technicians will appear here once they register on the platform."
        toolbar={
          <>
            <Select
              options={VERIFICATION_OPTIONS}
              value={verificationFilter}
              onChange={(e) => { setVerificationFilter(e.target.value); setPage(1); }}
              className="w-[170px]"
              placeholder=""
            />
            <Select
              options={AVAILABILITY_OPTIONS}
              value={availabilityFilter}
              onChange={(e) => { setAvailabilityFilter(e.target.value); setPage(1); }}
              className="w-[160px]"
              placeholder=""
            />
          </>
        }
      />
    </div>
  );
}
