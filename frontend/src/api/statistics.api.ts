import apiClient from './client';

export const statisticsApi = {
  getGerencial: async (params?: Record<string, string>) => {
    const { data } = await apiClient.get('/statistics/gerencial', { params });
    return data?.data ?? data;
  },
};
