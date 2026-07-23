import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Booking, BookingQueryParams, PaginatedResponse } from '@/lib/types';

import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export function useBookings(params?: BookingQueryParams & { isHistory?: boolean }) {
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: async () => {
      const endpoint = params?.isHistory ? endpoints.bookings.history : endpoints.bookings.list;
      // Copy params and remove isHistory before sending to API
      const apiParams = { ...params };
      delete apiParams.isHistory;
      
      const { data } = await apiClient.get<PaginatedResponse<Booking>>(endpoint, {
        params: apiParams,
      });
      return data.data;
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

export function useUpdateNotes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, notes }: { bookingId: string; notes: string }) => {
      const { data } = await apiClient.patch(endpoints.bookings.notes(bookingId), { notes });
      return data;
    },
    onSuccess: (_, { bookingId }) => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason?: string }) => {
      const { data } = await apiClient.patch(endpoints.bookings.cancel(bookingId), { reason });
      return data;
    },
    onSuccess: (_, { bookingId }) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
    },
  });
}
