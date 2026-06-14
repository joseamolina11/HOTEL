import apiClient from './client';
import { HotelConfig } from '@/types/hotel.types';

export const hotelConfigApi = {
  getConfig: async (): Promise<HotelConfig> => {
    const { data } = await apiClient.get('/hotel-config');
    return data.data;
  },

  updateConfig: async (dto: Partial<HotelConfig>): Promise<HotelConfig> => {
    const { data } = await apiClient.put('/hotel-config', dto);
    return data.data;
  },

  uploadLogo: async (file: File): Promise<{ logo: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post('/hotel-config/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },
};
