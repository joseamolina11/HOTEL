import apiClient from './client';

export const expenseCategoriesApi = {
  findAll: async (page?: number) => {
    const { data } = await apiClient.get('/expense-categories', { params: { page, limit: 10 } });
    return data;
  },

  search: async (query: string) => {
    const { data } = await apiClient.get('/expense-categories', { params: { search: query || undefined, limit: 50 } });
    return (data.data?.data || []).map((c: any) => ({ value: c.id, label: c.nombre }));
  },

  findAllActive: async () => {
    const { data } = await apiClient.get('/expense-categories/all');
    return data.data;
  },

  findOne: async (id: string) => {
    const { data } = await apiClient.get(`/expense-categories/${id}`);
    return data.data;
  },

  create: async (dto: any) => {
    const { data } = await apiClient.post('/expense-categories', dto);
    return data.data;
  },

  update: async (id: string, dto: any) => {
    const { data } = await apiClient.put(`/expense-categories/${id}`, dto);
    return data.data;
  },

  remove: async (id: string) => {
    await apiClient.delete(`/expense-categories/${id}`);
  },
};
