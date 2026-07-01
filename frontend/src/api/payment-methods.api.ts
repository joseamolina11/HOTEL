import apiClient from './client';

export const paymentMethodsApi = {
  findAll: async (params?: Record<string, string>) => {
    const { data } = await apiClient.get('/payment-methods', { params });
    return data;
  },

  findAllActive: async () => {
    const { data } = await apiClient.get('/payment-methods/all');
    return data.data;
  },

  findOne: async (id: string) => {
    const { data } = await apiClient.get(`/payment-methods/${id}`);
    return data.data;
  },

  create: async (dto: { nombre: string; descripcion?: string }) => {
    const { data } = await apiClient.post('/payment-methods', dto);
    return data.data;
  },

  update: async (id: string, dto: { nombre?: string; descripcion?: string; activo?: boolean }) => {
    const { data } = await apiClient.put(`/payment-methods/${id}`, dto);
    return data.data;
  },

  remove: async (id: string) => {
    const { data } = await apiClient.delete(`/payment-methods/${id}`);
    return data.data;
  },
};
