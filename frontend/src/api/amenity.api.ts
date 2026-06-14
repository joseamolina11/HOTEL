import { Amenity, CreateAmenityDto } from '@/types/hotel.types';
import apiClient from './client';

export const amenityApi = {
  findAll: async (search?: string, page?: number) => {
    const { data } = await apiClient.get('Amenities', { params: { search, page, limit: 10 } });
    return data;
  },

  findOne: async (id: string): Promise<Amenity> => {
    const { data } = await apiClient.get(`/Amenities/${id}`);
    return data.data;
  },

  create: async (dto: CreateAmenityDto): Promise<Amenity> => {
    const { data } = await apiClient.post('/Amenities', dto);
    return data.data;
  },

  update: async (id: string, dto: Partial<CreateAmenityDto>): Promise<Amenity> => {
    const { data } = await apiClient.put(`/Amenities/${id}`, dto);
    return data.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/Amenities/${id}`);
  },
};
