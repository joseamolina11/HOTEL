import apiClient from './client';

export const expensesApi = {
  findAll: async (params?: Record<string, string>) => {
    const { data } = await apiClient.get('/expenses', { params: { ...params, limit: '10' } });
    return data;
  },

  search: async (query: string) => {
    const { data } = await apiClient.get('/expenses', { params: { search: query || undefined, limit: 50 } });
    return (data.data?.data || []).map((e: any) => ({ value: e.id, label: `${e.codigo} - ${e.concepto}` }));
  },

  findOne: async (id: string) => {
    const { data } = await apiClient.get(`/expenses/${id}`);
    return data.data;
  },

  findByCodigo: async (codigo: string) => {
    const { data } = await apiClient.get(`/expenses/by-codigo/${codigo}`);
    return data.data;
  },

  getReport: async (params?: Record<string, string>) => {
    const { data } = await apiClient.get('/expenses/report', { params });
    return data.data;
  },

  create: async (dto: any) => {
    const { data } = await apiClient.post('/expenses', dto);
    return data.data;
  },

  update: async (id: string, dto: any) => {
    const { data } = await apiClient.put(`/expenses/${id}`, dto);
    return data.data;
  },

  remove: async (id: string) => {
    await apiClient.delete(`/expenses/${id}`);
  },
};
