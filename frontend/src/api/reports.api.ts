import apiClient from './client';

export const reportsApi = {
  getSurchargesReport: async (params?: { desde?: string; hasta?: string; dispersado?: string; terceroId?: string }) => {
    const { data } = await apiClient.get('/reports/surcharges', { params });
    return data?.data ?? data;
  },

  disperseSurcharges: async (ids: string[], disperse = true) => {
    const { data } = await apiClient.put('/reports/surcharges/disperse', { ids, disperse });
    return data?.data ?? data;
  },

  getCashCloseReport: async (params?: { desde?: string; hasta?: string }) => {
    const { data } = await apiClient.get('/reports/cash-close', { params });
    return data?.data ?? data;
  },

  getCashCloseDetail: async (id: string) => {
    const { data } = await apiClient.get(`/reports/cash-close/${id}`);
    return data?.data ?? data;
  },
};
