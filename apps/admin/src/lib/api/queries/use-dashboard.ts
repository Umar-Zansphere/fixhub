import { useQuery } from '@tanstack/react-query';

import type { ApiResponse, DashboardStats } from '@/lib/types';

import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<DashboardStats>>(endpoints.admin.dashboard);
      return data.data;
    },
  });
}
