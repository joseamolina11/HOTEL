import apiClient from './client';

export const cashRegisterApi = {
  findAll: async (params?: Record<string, string>) => {
    const { data } = await apiClient.get('/cash-register', { params });
    return data;
  },

  findOpen: async () => {
    const { data } = await apiClient.get('/cash-register/open');
    return data.data;
  },

  findOne: async (id: string) => {
    const { data } = await apiClient.get(`/cash-register/${id}`);
    return data.data;
  },

  findMovements: async (id: string, params?: Record<string, string>) => {
    const { data } = await apiClient.get(`/cash-register/${id}/movements`, { params });
    return data.data;
  },

  open: async (dto: { montoInicial: number; observaciones?: string }) => {
    const { data } = await apiClient.post('/cash-register/open', dto);
    return data.data;
  },

  close: async (id: string, dto: {
    totalEfectivo: number;
    totalTransferencia: number;
    totalTarjeta: number;
    totalOtros: number;
    cantidadTransacciones: number;
    diferencia?: number;
    observaciones?: string;
  }) => {
    const { data } = await apiClient.put(`/cash-register/${id}/close`, dto);
    return data.data;
  },
};
