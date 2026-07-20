import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Booking, BookingQueryParams, PaginatedResponse } from '@/lib/types';

import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export function useBookings(params?: BookingQueryParams) {
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Booking>>(endpoints.bookings.list, {
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
      const { data } = await apiClient.get<{ data: Booking }>(endpoints.bookings.detail(id));
      return data.data;
    },
    enabled: !!id,
  });
}

export function useAssignTechnician() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, technicianId }: { bookingId: string; technicianId: string }) => {
      const { data } = await apiClient.patch(endpoints.bookings.assign(bookingId), { technicianId });
      return data;
    },
    onSuccess: (_, { bookingId }) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
    },
  });
}
