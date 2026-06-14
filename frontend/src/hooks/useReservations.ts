import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationsApi } from '@/api/reservations.api';
import { CreateReservationDto } from '@/types/reservation.types';
import { toastSuccess } from '@/lib/notifications';

export function useReservations(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['reservations', params],
    queryFn: () => reservationsApi.findAll(params),
  });
}

export function useReservation(id: string) {
  return useQuery({
    queryKey: ['reservation', id],
    queryFn: () => reservationsApi.findOne(id),
    enabled: !!id,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateReservationDto) => reservationsApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['rooms', 'available'] });
      toastSuccess('Reserva creada correctamente');
    },
  });
}

export function useUpdateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateReservationDto> }) =>
      reservationsApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservation'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toastSuccess('Reserva actualizada correctamente');
    },
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo?: string }) =>
      reservationsApi.cancel(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toastSuccess('Reserva cancelada correctamente');
    },
  });
}

export function useConfirmReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reservationsApi.confirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toastSuccess('Reserva confirmada correctamente');
    },
  });
}
