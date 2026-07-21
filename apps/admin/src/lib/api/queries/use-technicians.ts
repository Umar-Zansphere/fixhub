import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { PaginatedResponse, Technician, TechnicianQueryParams, VerificationStatus } from '@/lib/types';

import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export function useTechnicians(params?: TechnicianQueryParams) {
  return useQuery({
    queryKey: ['technicians', params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Technician>>(
        endpoints.admin.technicians,
        { params },
      );
      return data.data;
    },
  });
}

export function useTechnician(id: string) {
  return useQuery({
    queryKey: ['technician', id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Technician }>(
        endpoints.admin.technician(id),
      );
      return data.data;
    },
    enabled: !!id,
  });
}

export function useUpdateTechnicianStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { data } = await apiClient.patch(endpoints.admin.technicianStatus(userId), { isActive });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['technicians'] });
    },
  });
}

export function useVerifyTechnician() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      rejectionNote,
    }: {
      id: string;
      status: VerificationStatus;
      rejectionNote?: string;
    }) => {
      const { data } = await apiClient.patch(endpoints.admin.technicianVerify(id), {
        status,
        rejectionNote,
      });
      return data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['technicians'] });
      qc.invalidateQueries({ queryKey: ['technician', id] });
    },
  });
}
