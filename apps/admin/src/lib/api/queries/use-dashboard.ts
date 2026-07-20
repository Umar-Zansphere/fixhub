import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { DashboardStats } from '@/lib/types';

import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: DashboardStats }>(endpoints.admin.dashboard);
      return data.data;
    },
    staleTime: 30 * 1000, // 30s
  });
}
