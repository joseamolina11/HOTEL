import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '@/api/payments.api';

export function usePayments(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => paymentsApi.findAll(params),
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Parameters<typeof paymentsApi.create>[0]) => paymentsApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
