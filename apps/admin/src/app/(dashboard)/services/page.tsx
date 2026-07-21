'use client';

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { useServices, useCreateService, useUpdateService, useDeleteService, useService } from '@/lib/api/queries/use-services';
import { useCategories } from '@/lib/api/queries/use-categories';
import type { SubService } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Badge, Button, Dialog, Input, Select, Skeleton } from '@/components/ui';
import { DataTable, SortableHeader } from '@/components/data-table/data-table';

const serviceSchema = z.object({
  name: z.string().min(2),
  categoryId: z.string().uuid('Select a category'),
  description: z.string().optional(),
  basePrice: z.coerce.number().min(0),
  estimatedDurationMins: z.coerce.number().min(1),
  isActive: z.boolean(),
});
type ServiceForm = z.infer<typeof serviceSchema>;

function ServiceDialog({
  open, onClose, editServiceId,
}: { open: boolean; onClose: () => void; editServiceId?: string | null }) {
  const { data: categories } = useCategories();
  const { data: serviceData } = useService(editServiceId ?? undefined);
  const editService = serviceData;

  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: '', categoryId: '', description: '', basePrice: 0, estimatedDurationMins: 60, isActive: true },
  });

  React.useEffect(() => {
    if (open) reset(
      editService
        ? { name: editService.name, categoryId: editService.categoryId, description: editService.description ?? '', basePrice: Number(editService.basePrice), estimatedDurationMins: editService.estimatedDurationMins, isActive: editService.isActive }
        : { name: '', categoryId: '', description: '', basePrice: 0, estimatedDurationMins: 60, isActive: true },
    );
  }, [open, editService, reset]);

  const onSubmit = (values: ServiceForm) => {
    if (editService) {
      updateMutation.mutate({ id: editService.id, ...values }, {
        onSuccess: () => { toast.success('Service updated'); onClose(); },
      });
    } else {
      createMutation.mutate(values, {
        onSuccess: () => { toast.success('Service created'); onClose(); },
      });
    }
  };

  const categoryOptions = (categories ?? []).map((c) => ({ label: c.name, value: c.id }));

  return (
    <Dialog open={open} onClose={onClose} title={editService ? 'Edit Service' : 'New Service'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Service Name" placeholder="e.g. Fan Repair" error={errors.name?.message} {...register('name')} />
        <Select label="Category" options={categoryOptions} placeholder="Select category" error={errors.categoryId?.message} {...register('categoryId')} />
        <Input label="Description" placeholder="Brief description..." {...register('description')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Base Price (₹)" type="number" error={errors.basePrice?.message} {...register('basePrice')} />
          <Input label="Duration (mins)" type="number" error={errors.estimatedDurationMins?.message} {...register('estimatedDurationMins')} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="svcActive" {...register('isActive')} className="rounded" />
          <label htmlFor="svcActive" className="text-sm font-medium text-[#374151]">Active</label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
            {editService ? 'Save Changes' : 'Create Service'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export default function ServicesPage() {
  const { data: services, isLoading } = useServices();
  const deleteMutation = useDeleteService();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editServiceId, setEditServiceId] = React.useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<SubService | null>(null);

  const columns: ColumnDef<SubService, unknown>[] = [
    {
      id: 'name',
      header: ({ column }) => <SortableHeader column={column}>Service</SortableHeader>,
      accessorKey: 'name',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium text-[#111827]">{row.original.name}</p>
          {row.original.description && (
            <p className="text-xs text-[#9CA3AF] truncate max-w-[200px]">{row.original.description}</p>
          )}
        </div>
      ),
      size: 220,
    },
    {
      id: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <span className="text-sm text-[#374151]">{row.original.category?.name ?? '—'}</span>
      ),
      size: 140,
    },
    {
      id: 'price',
      header: ({ column }) => <SortableHeader column={column}>Base Price</SortableHeader>,
      accessorKey: 'basePrice',
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-[#111827]">{formatCurrency(row.original.basePrice)}</span>
      ),
      size: 120,
    },
    {
      id: 'duration',
      header: 'Duration',
      cell: ({ row }) => (
        <span className="text-sm text-[#374151]">{row.original.estimatedDurationMins} min</span>
      ),
      size: 100,
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
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditServiceId(row.original.id); setDialogOpen(true); }}>
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

  return (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Services</h1>
          <p className="mt-0.5 text-sm text-[#6B7280]">{services?.length ?? 0} sub-services</p>
        </div>
        <Button onClick={() => { setEditServiceId(null); setDialogOpen(true); }} leftIcon={<Plus className="h-4 w-4" />}>
          New Service
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={services ?? []}
        loading={isLoading}
        searchPlaceholder="Search services..."
        emptyTitle="No services found"
        emptyDescription="Create your first service to get started."
      />

      <ServiceDialog open={dialogOpen} onClose={() => setDialogOpen(false)} editServiceId={editServiceId} />

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Service" description={`Delete "${deleteConfirm?.name}"? Services linked to bookings cannot be deleted.`}>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id, { onSuccess: () => { toast.success('Service deleted'); setDeleteConfirm(null); } })}>
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
