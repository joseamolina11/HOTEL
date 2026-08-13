import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { surchargeTypesApi } from '@/api/surcharge-types.api';
import { surchargesApi } from '@/api/surcharges.api';

export function useSurchargeTypes() {
  return useQuery({
    queryKey: ['surcharge-types'],
    queryFn: () => surchargeTypesApi.findAll(),
  });
}

export function useActiveSurchargeTypes() {
  return useQuery({
    queryKey: ['surcharge-types', 'active'],
    queryFn: () => surchargeTypesApi.findActive(),
  });
}

export function useCreateSurchargeType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => surchargeTypesApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['surcharge-types'] }),
  });
}

export function useUpdateSurchargeType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => surchargeTypesApi.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['surcharge-types'] }),
  });
}

export function useDeleteSurchargeType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => surchargeTypesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['surcharge-types'] }),
  });
}

export function useReservationSurcharges(reservationId: string | undefined) {
  return useQuery({
    queryKey: ['surcharges', reservationId],
    queryFn: () => surchargesApi.findByReservation(reservationId!),
    enabled: !!reservationId,
  });
}

export function useCreateSurcharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => surchargesApi.create(dto),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['surcharges', variables.reservationId] });
    },
  });
}

export function useRemoveSurcharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => surchargesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['surcharges'] });
    },
  });
}

export function useUpdateSurcharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => surchargesApi.update(id, dto),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['surcharges'] });
      qc.invalidateQueries({ queryKey: ['reservation', variables.id] });
      qc.invalidateQueries({ queryKey: ['stay-summary'] });
    },
  });
}
