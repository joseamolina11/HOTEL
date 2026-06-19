import apiClient from './client';

export const suppliersApi = {
  findAll: async (search?: string, page?: number) => {
    const { data } = await apiClient.get('/suppliers', { params: { search, page, limit: 10 } });
    return data;
  },

  search: async (query: string) => {
    const { data } = await apiClient.get('/suppliers', { params: { search: query || undefined, limit: 50 } });
    return (data.data?.data || []).map((s: any) => ({ value: s.id, label: s.razonSocial }));
  },

  findAllActive: async () => {
    const { data } = await apiClient.get('/suppliers/all');
    return data.data;
  },

  findOne: async (id: string) => {
    const { data } = await apiClient.get(`/suppliers/${id}`);
    return data.data;
  },

  create: async (dto: any) => {
    const { data } = await apiClient.post('/suppliers', dto);
    return data.data;
  },

  update: async (id: string, dto: any) => {
    const { data } = await apiClient.put(`/suppliers/${id}`, dto);
    return data.data;
  },

  remove: async (id: string) => {
    await apiClient.delete(`/suppliers/${id}`);
  },
};
