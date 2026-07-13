import { useQuery } from '@tanstack/react-query';

import type { Booking,PaginatedResponse } from '@/lib/types';

import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export function useBookings(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Booking>>(endpoints.admin.bookings, {
        params,
      });
      return data;
    },
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const { data } = await apiClient.get(endpoints.admin.booking(id));
      return data.data;
    },
    enabled: !!id,
  });
}
