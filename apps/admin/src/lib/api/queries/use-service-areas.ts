import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { PaginatedResponse, ServiceArea } from '@/lib/types';

import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export function useServiceAreas(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['service-areas', params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<ServiceArea>>(
        endpoints.serviceAreas.list,
        { params },
      );
      return data.data;
    },
  });
}

export function useCreateServiceArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; pincode: string; city: string; state: string; isActive?: boolean }) => {
      const { data } = await apiClient.post(endpoints.serviceAreas.create, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-areas'] });
    },
  });
}

export function useUpdateServiceArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name?: string; isActive?: boolean }) => {
      const { data } = await apiClient.patch(endpoints.serviceAreas.update(id), payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-areas'] });
    },
  });
}

export function useDeleteServiceArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(endpoints.serviceAreas.delete(id));
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-areas'] });
    },
  });
}
