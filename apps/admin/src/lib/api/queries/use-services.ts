import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { SubService } from '@/lib/types';

import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export function useServices(categoryId?: string) {
  return useQuery({
    queryKey: ['services', categoryId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { items: SubService[] } }>(endpoints.catalog.services, {
        params: categoryId ? { categoryId } : undefined,
      });
      return data.data.items;
    },
  });
}

export function useService(id?: string) {
  return useQuery({
    queryKey: ['services', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: SubService }>(endpoints.catalog.service(id!));
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      categoryId: string;
      name: string;
      description?: string;
      basePrice: number;
      estimatedDurationMins: number;
      isActive?: boolean;
    }) => {
      const { data } = await apiClient.post(endpoints.catalog.createService, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name?: string; description?: string; isActive?: boolean }) => {
      const { data } = await apiClient.patch(endpoints.catalog.updateService(id), payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

export function useUpdatePricing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, basePrice }: { id: string; basePrice: number }) => {
      const { data } = await apiClient.patch(endpoints.catalog.updatePricing(id), { basePrice });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(endpoints.catalog.deleteService(id));
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
    },
  });
}
