import apiClient from './client';

export interface CreateConsumptionDto {
  reservationId: string;
  inventoryItemId: string;
  cantidad: number;
  fecha?: string;
}

export const consumptionsApi = {
  findAll: async (filters?: Record<string, string>) => {
    const { data } = await apiClient.get('/consumptions', { params: filters });
    return data.data;
  },

  findOne: async (id: string) => {
    const { data } = await apiClient.get(`/consumptions/${id}`);
    return data.data;
  },

  create: async (dto: CreateConsumptionDto) => {
    const { data } = await apiClient.post('/consumptions', dto);
    return data.data;
  },
};
