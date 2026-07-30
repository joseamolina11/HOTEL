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
    roomId?: string;
    reservationId?: string;
    guestId?: string;
    clienteNombre?: string;
    items: { inventoryItemId: string; cantidad: number; precioUnitario: number }[];
    observaciones?: string;
    pagoMetodoPagoId?: string;
    pagoMonto?: number;
    pagoReferencia?: string;
    ventaDirecta?: boolean;
  }) => {
    const { data } = await apiClient.post('/orders', dto);
    return data.data;
  },

  update: async (id: string, dto: {
    roomId?: string;
    observaciones?: string;
    items?: { inventoryItemId: string; cantidad: number; precioUnitario: number }[];
  }) => {
    const { data } = await apiClient.put(`/orders/${id}`, dto);
    return data.data;
  },

  cancel: async (id: string) => {
    const { data } = await apiClient.put(`/orders/${id}/cancel`);
    return data.data;
  },
};
