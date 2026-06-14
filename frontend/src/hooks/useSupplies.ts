import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliesApi } from '@/api/supplies.api';

export function useSupplies(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['supplies', params],
    queryFn: () => suppliesApi.findAll(params),
  });
}

export function useLowStockSupplies() {
  return useQuery({
    queryKey: ['supplies', 'low-stock'],
    queryFn: () => suppliesApi.findLowStock(),
  });
}

export function useCreateSupplyItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => suppliesApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplies'] }),
  });
}

export function useUpdateSupplyItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => suppliesApi.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplies'] }),
  });
}

export function useDeleteSupplyItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => suppliesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplies'] }),
  });
}

export function useCreateSupplyMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => suppliesApi.createMovement(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplies'] }),
  });
}
