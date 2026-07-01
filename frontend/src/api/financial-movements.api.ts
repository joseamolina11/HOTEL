import apiClient from './client';

export const financialMovementsApi = {
  findAll: async (params?: Record<string, string>) => {
    const { data } = await apiClient.get('/financial-movements', { params });
    return data;
  },

  findByAccount: async (accountId: string, params?: Record<string, string>) => {
    const { data } = await apiClient.get(`/financial-movements/account/${accountId}`, { params });
    return data;
  },

  findOne: async (id: string) => {
    const { data } = await apiClient.get(`/financial-movements/${id}`);
    return data.data;
  },

  create: async (dto: {
    accountId: string;
    tipo: string;
    monto: number;
    concepto: string;
    referenciaTipo?: string;
    referenciaId?: string;
  }) => {
    const { data } = await apiClient.post('/financial-movements', dto);
    return data.data;
  },

  transfer: async (dto: {
    originAccountId: string;
    destinationAccountId: string;
    monto: number;
    concepto?: string;
  }) => {
    const { data } = await apiClient.post('/financial-movements/transfer', dto);
    return data.data;
  },
};
