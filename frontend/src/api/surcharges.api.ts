import apiClient from './client';

export const surchargesApi = {
  findAll: async (filters?: { reservationId?: string }) => {
    const { data } = await apiClient.get('/surcharges', { params: filters });
    return data?.data ?? data;
  },

  findByReservation: async (reservationId: string) => {
    const { data } = await apiClient.get(`/surcharges/reservation/${reservationId}`);
    return data?.data ?? data;
  },

  getTotal: async (reservationId: string) => {
    const { data } = await apiClient.get(`/surcharges/total/${reservationId}`);
    return data?.data ?? data;
  },

  create: async (dto: any) => {
    const { data } = await apiClient.post('/surcharges', dto);
    return data?.data ?? data;
  },

  remove: async (id: string) => {
    await apiClient.delete(`/surcharges/${id}`);
  },
};
