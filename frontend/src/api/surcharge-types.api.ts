import apiClient from './client';

export const surchargeTypesApi = {
  findAll: async () => {
    const { data } = await apiClient.get('/surcharge-types');
    return data?.data ?? data;
  },

  findActive: async () => {
    const { data } = await apiClient.get('/surcharge-types/active');
    return data?.data ?? data;
  },

  findOne: async (id: string) => {
    const { data } = await apiClient.get(`/surcharge-types/${id}`);
    return data?.data ?? data;
  },

  create: async (dto: any) => {
    const { data } = await apiClient.post('/surcharge-types', dto);
    return data?.data ?? data;
  },

  update: async (id: string, dto: any) => {
    const { data } = await apiClient.put(`/surcharge-types/${id}`, dto);
    return data?.data ?? data;
  },

  remove: async (id: string) => {
    await apiClient.delete(`/surcharge-types/${id}`);
  },
};
