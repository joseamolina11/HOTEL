import apiClient from './client';

export const accountsPayableApi = {
  findAll: async (params?: Record<string, string>) => {
    const { data } = await apiClient.get('/accounts-payable', { params: { ...params, limit: '10' } });
    return data;
  },

  search: async (query: string) => {
    const { data } = await apiClient.get('/accounts-payable', { params: { search: query || undefined, limit: 50 } });
    return (data.data?.data || []).map((a: any) => ({ value: a.id, label: `${a.codigo} - ${a.supplier?.razonSocial || ''} ($${Number(a.saldoPendiente).toFixed(2)})` }));
  },

  findOne: async (id: string) => {
    const { data } = await apiClient.get(`/accounts-payable/${id}`);
    return data.data;
  },

  create: async (dto: any) => {
    const { data } = await apiClient.post('/accounts-payable', dto);
    return data.data;
  },

  update: async (id: string, dto: any) => {
    const { data } = await apiClient.put(`/accounts-payable/${id}`, dto);
    return data.data;
  },

  remove: async (id: string) => {
    await apiClient.delete(`/accounts-payable/${id}`);
  },

  findBySupplier: async (supplierId: string) => {
    const { data } = await apiClient.get(`/accounts-payable/by-supplier/${supplierId}`);
    return data.data;
  },

  registerPago: async (cuentaId: string, dto: any) => {
    const { data } = await apiClient.post(`/accounts-payable/${cuentaId}/pagos`, dto);
    return data.data;
  },

  getPagos: async (cuentaId: string) => {
    const { data } = await apiClient.get(`/accounts-payable/${cuentaId}/pagos`);
    return data.data;
  },
};
