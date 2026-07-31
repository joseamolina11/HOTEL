import apiClient from './client';

export const tercerosApi = {
  findAll: async (params?: Record<string, string | undefined>) => {
    const { data } = await apiClient.get('/terceros', { params });
    return data;
  },

  findAllActive: async () => {
    const { data } = await apiClient.get('/terceros/active');
    return data?.data ?? data;
  },

  findOne: async (id: string) => {
    const { data } = await apiClient.get(`/terceros/${id}`);
    return data?.data ?? data;
  },

  create: async (dto: any) => {
    const { data } = await apiClient.post('/terceros', dto);
    return data?.data ?? data;
  },

  update: async (id: string, dto: any) => {
    const { data } = await apiClient.put(`/terceros/${id}`, dto);
    return data?.data ?? data;
  },

  remove: async (id: string) => {
    await apiClient.delete(`/terceros/${id}`);
  },
};
