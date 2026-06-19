import apiClient from './client';

export const usersApi = {
  findAll: async (params?: Record<string, string>) => {
    const { data } = await apiClient.get('/users', { params });
    return data;
  },

  findOne: async (id: string) => {
    const { data } = await apiClient.get(`/users/${id}`);
    return data.data;
  },

  create: async (dto: { email: string; password: string; nombres: string; apellidos: string; role: string }) => {
    const { data } = await apiClient.post('/users', dto);
    return data.data;
  },

  update: async (id: string, dto: any) => {
    const { data } = await apiClient.put(`/users/${id}`, dto);
    return data.data;
  },

  toggleActive: async (id: string) => {
    const { data } = await apiClient.put(`/users/${id}/toggle-active`);
    return data.data;
  },
};
