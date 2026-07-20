'use client';

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { MapPin, Plus, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { useServiceAreas, useCreateServiceArea, useUpdateServiceArea, useDeleteServiceArea } from '@/lib/api/queries/use-service-areas';
import type { ServiceArea } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Badge, Button, Dialog, Input } from '@/components/ui';
import { DataTable, SortableHeader } from '@/components/data-table/data-table';

const areaSchema = z.object({
  name: z.string().min(2),
  pincode: z.string().length(6, 'Pincode must be 6 digits'),
  city: z.string().min(2),
  state: z.string().min(2),
  isActive: z.boolean(),
});
type AreaForm = z.infer<typeof areaSchema>;

function AreaDialog({ open, onClose, editArea }: { open: boolean; onClose: () => void; editArea?: ServiceArea | null }) {
  const createMutation = useCreateServiceArea();
  const updateMutation = useUpdateServiceArea();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AreaForm>({
    resolver: zodResolver(areaSchema),
    defaultValues: editArea
      ? { name: editArea.name, pincode: editArea.pincode, city: editArea.city, state: editArea.state, isActive: editArea.isActive }
      : { name: '', pincode: '', city: 'Chennai', state: 'Tamil Nadu', isActive: true },
  });

  React.useEffect(() => {
    if (open) reset(
      editArea
        ? { name: editArea.name, pincode: editArea.pincode, city: editArea.city, state: editArea.state, isActive: editArea.isActive }
        : { name: '', pincode: '', city: 'Chennai', state: 'Tamil Nadu', isActive: true },
    );
  }, [open, editArea, reset]);

  const onSubmit = (values: AreaForm) => {
    if (editArea) {
      updateMutation.mutate({ id: editArea.id, name: values.name, isActive: values.isActive }, {
        onSuccess: () => { toast.success('Service area updated'); onClose(); },
      });
    } else {
      createMutation.mutate(values, {
        onSuccess: () => { toast.success('Service area created'); onClose(); },
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={editArea ? 'Edit Service Area' : 'New Service Area'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Area Name" placeholder="e.g. Kolathur" error={errors.name?.message} {...register('name')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Pincode" placeholder="600099" maxLength={6} error={errors.pincode?.message} {...register('pincode')} disabled={!!editArea} />
          <Input label="City" placeholder="Chennai" error={errors.city?.message} {...register('city')} disabled={!!editArea} />
        </div>
        <Input label="State" placeholder="Tamil Nadu" error={errors.state?.message} {...register('state')} disabled={!!editArea} />
        <div className="flex items-center gap-2">
          <input type="checkbox" id="areaActive" {...register('isActive')} className="rounded" />
          <label htmlFor="areaActive" className="text-sm font-medium text-[#374151]">Active</label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
            {editArea ? 'Save Changes' : 'Create Area'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export default function ServiceAreasPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useServiceAreas({ page, limit: 20 });
  const deleteMutation = useDeleteServiceArea();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editArea, setEditArea] = React.useState<ServiceArea | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<ServiceArea | null>(null);

  const columns: ColumnDef<ServiceArea, unknown>[] = [
    {
      id: 'area',
      header: 'Area',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#9CA3AF]" />
          <div>
            <p className="text-sm font-medium text-[#111827]">{row.original.name}</p>
            <p className="text-xs text-[#9CA3AF]">{row.original.pincode}</p>
          </div>
        </div>
      ),
      size: 200,
    },
    {
      id: 'city',
      header: 'City',
      accessorKey: 'city',
      cell: ({ row }) => <span className="text-sm text-[#374151]">{row.original.city}</span>,
      size: 130,
    },
    {
      id: 'state',
      header: 'State',
      cell: ({ row }) => <span className="text-sm text-[#374151]">{row.original.state}</span>,
      size: 130,
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'success' : 'neutral'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
      size: 100,
    },
    {
      id: 'created',
      header: 'Added',
      cell: ({ row }) => <span className="text-xs text-[#9CA3AF]">{formatDate(row.original.createdAt)}</span>,
      size: 110,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditArea(row.original); setDialogOpen(true); }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-[#EF4444] hover:bg-[#FEF2F2]" onClick={() => setDeleteConfirm(row.original)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
      size: 80,
    },
  ];

  const pageCount = data?.meta ? Math.ceil(data.meta.total / 20) : 1;

  return (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Service Areas</h1>
          <p className="mt-0.5 text-sm text-[#6B7280]">{data?.meta?.total ?? 0} coverage zones</p>
        </div>
        <Button onClick={() => { setEditArea(null); setDialogOpen(true); }} leftIcon={<Plus className="h-4 w-4" />}>
          New Area
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        searchPlaceholder="Search areas..."
        totalItems={data?.meta?.total}
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
        emptyTitle="No service areas"
        emptyDescription="Add service areas to define your coverage zones."
      />

      <AreaDialog open={dialogOpen} onClose={() => setDialogOpen(false)} editArea={editArea} />

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Service Area" description={`Delete "${deleteConfirm?.name}" (${deleteConfirm?.pincode})? Active bookings in this area may be affected.`}>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id, { onSuccess: () => { toast.success('Area deleted'); setDeleteConfirm(null); } })}>
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
