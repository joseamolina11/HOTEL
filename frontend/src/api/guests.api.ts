import apiClient from './client';
import { Guest, CreateGuestDto } from '@/types/guest.types';

export const guestsApi = {
  findAll: async (search?: string, page?: number) => {
    const { data } = await apiClient.get('/guests', { params: { search, page, limit: 10 } });
    return data;
  },

  findOne: async (id: string): Promise<Guest> => {
    const { data } = await apiClient.get(`/guests/${id}`);
    return data.data;
  },

  create: async (dto: CreateGuestDto): Promise<Guest> => {
    const { data } = await apiClient.post('/guests', dto);
    return data.data;
  },

  update: async (id: string, dto: Partial<CreateGuestDto>): Promise<Guest> => {
    const { data } = await apiClient.put(`/guests/${id}`, dto);
    return data.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/guests/${id}`);
  },
};
