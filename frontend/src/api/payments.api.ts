import apiClient from './client';

export const paymentsApi = {
  findAll: async (params?: Record<string, string>) => {
    const { data } = await apiClient.get('/payments', { params });
    return data;
  },

  findByRoom: async (roomId: string) => {
    const { data } = await apiClient.get(`/payments/room/${roomId}`);
    return data.data;
  },

  create: async (dto: {
    orderId?: string;
    roomId: string;
    monto: number;
    metodoPago: 'efectivo' | 'transferencia' | 'tarjeta' | 'otros';
    comprobante?: string;
    observaciones?: string;
  }) => {
    const { data } = await apiClient.post('/payments', dto);
    return data.data;
  },
};
