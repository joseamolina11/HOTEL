import apiClient from './client';

export const purchaseOrdersApi = {
  findAll: async (params?: Record<string, string>) => {
    const { data } = await apiClient.get('/purchase-orders', { params: { ...params, limit: '10' } });
    return data;
  },

  search: async (query: string, supplierId?: string) => {
    const { data } = await apiClient.get('/purchase-orders', { params: { search: query || undefined, supplierId: supplierId || undefined, limit: 50 } });
    return (data.data?.data || []).map((po: any) => ({ value: po.id, label: `${po.codigo} - ${po.supplier?.razonSocial || ''} ($${Number(po.total).toFixed(2)})` }));
  },

  findOne: async (id: string) => {
    const { data } = await apiClient.get(`/purchase-orders/${id}`);
    return data.data;
  },

  create: async (dto: any) => {
    const { data } = await apiClient.post('/purchase-orders', dto);
    return data.data;
  },

  update: async (id: string, dto: any) => {
    const { data } = await apiClient.put(`/purchase-orders/${id}`, dto);
    return data.data;
  },

  updateStatus: async (id: string, estado: string) => {
    const { data } = await apiClient.put(`/purchase-orders/${id}/status`, { estado });
    return data.data;
  },

  remove: async (id: string) => {
    await apiClient.delete(`/purchase-orders/${id}`);
  },
};
