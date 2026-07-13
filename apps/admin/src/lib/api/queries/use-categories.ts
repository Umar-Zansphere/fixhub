import { useQuery } from '@tanstack/react-query';

import type { ApiResponse, Category } from '@/lib/types';

import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Category[]>>(endpoints.admin.categories);
      return data.data;
    },
  });
}
