import apiClient from './client';

export const taxConfigApi = {
  findAll: async (page?: number) => {
    const { data } = await apiClient.get('/tax-config', { params: { page, limit: 10 } });
    return data;
  },

  findAllActive: async () => {
    const { data } = await apiClient.get('/tax-config/active');
    return data.data;
  },

  findDefault: async () => {
    const { data } = await apiClient.get('/tax-config/default');
    return data.data;
  },

  findOne: async (id: string) => {
    const { data } = await apiClient.get(`/tax-config/${id}`);
    return data.data;
  },

  create: async (dto: any) => {
    const { data } = await apiClient.post('/tax-config', dto);
    return data.data;
  },

  update: async (id: string, dto: any) => {
    const { data } = await apiClient.put(`/tax-config/${id}`, dto);
    return data.data;
  },

  remove: async (id: string) => {
    await apiClient.delete(`/tax-config/${id}`);
  },
};
