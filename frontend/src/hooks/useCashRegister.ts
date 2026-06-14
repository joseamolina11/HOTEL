import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cashRegisterApi } from '@/api/cash-register.api';

export function useCashRegisters(page?: number) {
  return useQuery({
    queryKey: ['cash-register', page],
    queryFn: () => cashRegisterApi.findAll(page ? { page: String(page), limit: '10' } : undefined),
  });
}

export function useOpenCashRegister() {
  return useQuery({
    queryKey: ['cash-register', 'open'],
    queryFn: () => cashRegisterApi.findOpen(),
  });
}

export function useOpenNewCashRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { montoInicial: number; observaciones?: string }) => cashRegisterApi.open(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cash-register'] }),
  });
}

export function useCloseCashRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Parameters<typeof cashRegisterApi.close>[1] }) =>
      cashRegisterApi.close(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cash-register'] }),
  });
}
