import apiClient from './client';

export const reciboCajaApi = {
  findAll: async (params?: Record<string, string>) => {
    const { data } = await apiClient.get('/recibo-caja', { params: { ...params, limit: '10' } });
    return data;
  },

  findOne: async (id: string) => {
    const { data } = await apiClient.get(`/recibo-caja/${id}`);
    return data.data;
  },

  create: async (dto: any) => {
    const { data } = await apiClient.post('/recibo-caja', dto);
    return data.data;
  },

  findByReservation: async (reservationId: string) => {
    const { data } = await apiClient.get(`/recibo-caja/by-reservation/${reservationId}`);
    return data.data;
  },

  remove: async (id: string) => {
    await apiClient.delete(`/recibo-caja/${id}`);
  },
};
