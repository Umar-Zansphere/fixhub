import { useQuery } from '@tanstack/react-query';

import type { PaginatedResponse, Technician } from '@/lib/types';

import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export function useTechnicians(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['technicians', params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Technician>>(
        endpoints.admin.technicians,
        { params },
      );
      return data;
    },
  });
}

export function useTechnician(id: string) {
  return useQuery({
    queryKey: ['technician', id],
    queryFn: async () => {
      const { data } = await apiClient.get(endpoints.admin.technician(id));
      return data.data;
    },
    enabled: !!id,
  });
}
