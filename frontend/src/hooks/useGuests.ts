import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guestsApi } from '@/api/guests.api';
import { CreateGuestDto } from '@/types/guest.types';

export function useGuests(search?: string) {
  return useQuery({
    queryKey: ['guests', search],
    queryFn: async () => {
      const res = await guestsApi.findAll(search);
      return res?.data?.data || [];
    },
  });
}

export function useGuest(id: string) {
  return useQuery({
    queryKey: ['guest', id],
    queryFn: () => guestsApi.findOne(id),
    enabled: !!id,
  });
}

export function useCreateGuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateGuestDto) => guestsApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['guests'] }),
  });
}

export function useUpdateGuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateGuestDto> }) => guestsApi.update(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guests'] });
      qc.invalidateQueries({ queryKey: ['guest'] });
    },
  });
}

export function useDeleteGuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => guestsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['guests'] }),
  });
}
