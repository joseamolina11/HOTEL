import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/api/inventory.api';
import { CreateMovementDto } from '@/types/inventory.types';

export function useInventory(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['inventory', params],
    queryFn: () => inventoryApi.findAll(params),
  });
}

export function useLowStock() {
  return useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: () => inventoryApi.findLowStock(),
  });
}

export function useCreateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => inventoryApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });
}

export function useUpdateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => inventoryApi.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });
}

export function useDeleteInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });
}

export function useCreateMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateMovementDto) => inventoryApi.createMovement(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });
}
