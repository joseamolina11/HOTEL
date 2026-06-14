import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsApi } from '@/api/rooms.api';
import { CreateRoomDto, ChangeRoomStatusDto } from '@/types/room.types';

export function useRooms(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['rooms', params],
    queryFn: () => roomsApi.findAll(params),
  });
}

export function useAvailableRooms(fechaEntrada: string, fechaSalida: string) {
  return useQuery({
    queryKey: ['rooms', 'available', fechaEntrada, fechaSalida],
    queryFn: () => roomsApi.findAvailable(fechaEntrada, fechaSalida),
    enabled: !!fechaEntrada && !!fechaSalida,
  });
}

export function useRoom(id: string) {
  return useQuery({
    queryKey: ['room', id],
    queryFn: () => roomsApi.findOne(id),
    enabled: !!id,
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateRoomDto) => roomsApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
}

export function useChangeRoomStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ChangeRoomStatusDto }) =>
      roomsApi.changeStatus(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
}
