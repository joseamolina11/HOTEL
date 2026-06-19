import apiClient from './client';

export const housekeepingApi = {
  findAll: async (tipo?: string) => {
    const { data } = await apiClient.get('/housekeeping', { params: { tipo } });
    return data.data;
  },

  changeStatus: async (roomId: string, estado: string) => {
    const { data } = await apiClient.put(`/housekeeping/${roomId}/status`, { estado });
    return data.data;
  },

  assignSupplies: async (roomId: string, items: { supplyItemId: string; cantidad: number }[]) => {
    const { data } = await apiClient.post(`/housekeeping/${roomId}/supplies`, { items });
    return data.data;
  },

  getAssignedSupplies: async (roomId: string) => {
    const { data } = await apiClient.get(`/housekeeping/${roomId}/supplies`);
    return data.data;
  },

  completeCleaning: async (roomId: string) => {
    const { data } = await apiClient.post(`/housekeeping/${roomId}/complete`);
    return data.data;
  },
};
