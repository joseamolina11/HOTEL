import apiClient from './client';

export const servicesApi = {
  findAll: async (page?: number) => {
    const { data } = await apiClient.get('/services', { params: { page, limit: 10 } });
    return data;
  },

  search: async (query: string) => {
    const { data } = await apiClient.get('/services', { params: { search: query || undefined, limit: 50 } });
    return (data.data?.data || []).map((s: any) => ({ value: s.id, label: `${s.nombre} - $${Number(s.precio).toFixed(2)}` }));
  },

  findAllActive: async () => {
    const { data } = await apiClient.get('/services/all');
    return data.data;
  },

  findOne: async (id: string) => {
    const { data } = await apiClient.get(`/services/${id}`);
    return data.data;
  },

  create: async (dto: any) => {
    const { data } = await apiClient.post('/services', dto);
    return data.data;
  },

  update: async (id: string, dto: any) => {
    const { data } = await apiClient.put(`/services/${id}`, dto);
    return data.data;
  },

  remove: async (id: string) => {
    await apiClient.delete(`/services/${id}`);
  },
};
