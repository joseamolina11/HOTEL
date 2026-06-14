import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomTypesApi } from '@/api/room-types.api';

export function useRoomTypes() {
  return useQuery({
    queryKey: ['room-types'],
    queryFn: () => roomTypesApi.findAll(),
  });
}

export function useCreateRoomType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => roomTypesApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['room-types'] }),
  });
}

export function useUpdateRoomType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => roomTypesApi.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['room-types'] }),
  });
}

export function useDeleteRoomType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roomTypesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['room-types'] }),
  });
}
