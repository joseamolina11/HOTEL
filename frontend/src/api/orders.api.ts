import apiClient from './client';

export const ordersApi = {
  findAll: async (params?: Record<string, string>) => {
    const { data } = await apiClient.get('/orders', { params });
    return data;
  },

  findByRoom: async (roomId: string, params?: Record<string, string>) => {
    const { data } = await apiClient.get(`/orders/room/${roomId}`, { params });
    return data;
  },

  findOne: async (id: string) => {
    const { data } = await apiClient.get(`/orders/${id}`);
    return data.data;
  },

  getPendingByRoom: async () => {
    const { data } = await apiClient.get('/orders/pending-by-room');
    return data.data;
  },

  create: async (dto: {
    roomId: string;
    guestId?: string;
    items: { inventoryItemId: string; cantidad: number; precioUnitario: number }[];
    observaciones?: string;
  }) => {
    const { data } = await apiClient.post('/orders', dto);
    return data.data;
  },

  cancel: async (id: string) => {
    const { data } = await apiClient.put(`/orders/${id}/cancel`);
    return data.data;
  },
};
