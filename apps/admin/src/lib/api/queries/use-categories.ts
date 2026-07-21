import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Category } from '@/lib/types';

import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { items: Category[] } }>(endpoints.catalog.categories);
      return data.data.items;
    },
  });
}

export function useCategory(id?: string) {
  return useQuery({
    queryKey: ['categories', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Category }>(endpoints.catalog.category(id!));
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; iconUrl?: string; isActive?: boolean; sortOrder?: number }) => {
      const { data } = await apiClient.post(endpoints.catalog.createCategory, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name?: string; iconUrl?: string; isActive?: boolean; sortOrder?: number }) => {
      const { data } = await apiClient.patch(endpoints.catalog.updateCategory(id), payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(endpoints.catalog.deleteCategory(id));
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
