import apiClient from './client';

export const financialAccountsApi = {
  findAll: async (params?: Record<string, string>) => {
    const { data } = await apiClient.get('/financial-accounts', { params });
    return data;
  },

  findAllActive: async () => {
    const { data } = await apiClient.get('/financial-accounts/all');
    return data.data;
  },

  findOne: async (id: string) => {
    const { data } = await apiClient.get(`/financial-accounts/${id}`);
    return data.data;
  },

  create: async (dto: { nombre: string; tipo: string; saldoInicial?: number; descripcion?: string }) => {
    const { data } = await apiClient.post('/financial-accounts', dto);
    return data.data;
  },

  update: async (id: string, dto: { nombre?: string; tipo?: string; saldoInicial?: number; descripcion?: string; activo?: boolean }) => {
    const { data } = await apiClient.put(`/financial-accounts/${id}`, dto);
    return data.data;
  },

  remove: async (id: string) => {
    const { data } = await apiClient.delete(`/financial-accounts/${id}`);
    return data.data;
  },
};
