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

  getCashRegisterReport: async (params?: { desde?: string; hasta?: string }) => {
    const { data } = await apiClient.get('/reports/cash-register', { params });
    return data?.data ?? data;
  },

  getSalesReport: async (params?: { desde?: string; hasta?: string }) => {
    const { data } = await apiClient.get('/reports/sales', { params });
    return data?.data ?? data;
  },

  getExpensesReport: async (params?: { desde?: string; hasta?: string }) => {
    const { data } = await apiClient.get('/reports/expenses', { params });
    return data?.data ?? data;
  },
};
