import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/api/orders.api';

export function useOrders(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => ordersApi.findAll(params),
  });
}

export function usePendingByRoom() {
  return useQuery({
    queryKey: ['orders', 'pending-by-room'],
    queryFn: () => ordersApi.getPendingByRoom(),
  });
}

export function useRoomOrders(roomId: string, page?: number) {
  return useQuery({
    queryKey: ['orders', 'room', roomId, page],
    queryFn: () => ordersApi.findByRoom(roomId, { page: String(page || 1), limit: '10' }),
    enabled: !!roomId,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => ordersApi.findOne(id),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Parameters<typeof ordersApi.create>[0]) => ordersApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ordersApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}
