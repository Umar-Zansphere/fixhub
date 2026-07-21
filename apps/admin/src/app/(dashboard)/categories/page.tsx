'use client';

import * as React from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useCategory } from '@/lib/api/queries/use-categories';
import type { Category } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Badge, Button, Dialog, Input, Skeleton } from '@/components/ui';

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  iconUrl: z.string().url().optional().or(z.literal('')),
  sortOrder: z.coerce.number().min(0),
  isActive: z.boolean(),
});

type CategoryForm = z.infer<typeof categorySchema>;

function CategoryDialog({
  open,
  onClose,
  editCategoryId,
}: {
  open: boolean;
  onClose: () => void;
  editCategoryId?: string | null;
}) {
  const { data: categoryData, isLoading: isLoadingCategory } = useCategory(editCategoryId ?? undefined);
  const editCategory = categoryData;

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', iconUrl: '', sortOrder: 0, isActive: true },
  });

  React.useEffect(() => {
    if (open) {
      reset(
        editCategory
          ? { name: editCategory.name, iconUrl: editCategory.iconUrl ?? '', sortOrder: editCategory.sortOrder, isActive: editCategory.isActive }
          : { name: '', iconUrl: '', sortOrder: 0, isActive: true },
      );
    }
  }, [open, editCategory, reset]);

  const onSubmit = (values: CategoryForm) => {
    if (editCategory) {
      updateMutation.mutate(
        { id: editCategory.id, ...values, iconUrl: values.iconUrl || undefined },
        {
          onSuccess: () => { toast.success('Category updated'); onClose(); },
          onError: () => toast.error('Failed to update category'),
        },
      );
    } else {
      createMutation.mutate(
        { ...values, iconUrl: values.iconUrl || undefined },
        {
          onSuccess: () => { toast.success('Category created'); onClose(); },
          onError: () => toast.error('Failed to create category'),
        },
      );
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onClose={onClose} title={editCategory ? 'Edit Category' : 'New Category'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Name" placeholder="e.g. Electrical" error={errors.name?.message} {...register('name')} />
        <Input label="Icon URL" placeholder="https://..." error={errors.iconUrl?.message} {...register('iconUrl')} />
        <Input label="Sort Order" type="number" error={errors.sortOrder?.message} {...register('sortOrder')} />
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isActive" {...register('isActive')} className="rounded" />
          <label htmlFor="isActive" className="text-sm font-medium text-[#374151]">Active</label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isLoading}>{editCategory ? 'Save Changes' : 'Create Category'}</Button>
        </div>
      </form>
    </Dialog>
  );
}

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const deleteMutation = useDeleteCategory();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editCategoryId, setEditCategoryId] = React.useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<Category | null>(null);

  const openCreate = () => { setEditCategoryId(null); setDialogOpen(true); };
  const openEdit = (cat: Category) => { setEditCategoryId(cat.id); setDialogOpen(true); };

  return (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Categories</h1>
          <p className="mt-0.5 text-sm text-[#6B7280]">{categories?.length ?? 0} service categories</p>
        </div>
        <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>New Category</Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(categories ?? []).map((cat) => (
            <div key={cat.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {cat.iconUrl ? (
                    <img src={cat.iconUrl} alt={cat.name} className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F3F4F6] text-lg">
                      ⚡
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-[#111827]">{cat.name}</p>
                    <p className="text-xs text-[#9CA3AF]">Order: {cat.sortOrder}</p>
                  </div>
                </div>
                <Badge variant={cat.isActive ? 'success' : 'neutral'}>
                  {cat.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-[#F3F4F6] pt-3">
                <span className="text-xs text-[#9CA3AF]">Created {formatDate(cat.createdAt)}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(cat)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[#EF4444] hover:bg-[#FEF2F2]"
                    onClick={() => setDeleteConfirm(cat)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editCategoryId={editCategoryId}
      />

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Category"
        description={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() =>
              deleteConfirm &&
              deleteMutation.mutate(deleteConfirm.id, {
                onSuccess: () => { toast.success('Category deleted'); setDeleteConfirm(null); },
              })
            }
          >
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
