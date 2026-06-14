import apiClient from './client';
import { RoomType } from '@/types/hotel.types';

export interface RoomTypeAvailability {
  id: string;
  nombre: string;
  totalRooms: number;
  availableRooms: number;
  precioBase: number;
  capacidadAdultos: number;
  capacidadNinos: number;
  colorIdentificador: string;
}

export const roomTypesApi = {
  findAll: async (params?: Record<string, string>) => {
    const { data } = await apiClient.get('/room-types', { params });
    return data;
  },

  getAvailability: async (fechaEntrada: string, fechaSalida: string): Promise<RoomTypeAvailability[]> => {
    const { data } = await apiClient.get('/room-types/availability', {
      params: { fechaEntrada, fechaSalida },
    });
    return data.data;
  },

  create: async (dto: Partial<RoomType>): Promise<RoomType> => {
    const { data } = await apiClient.post('/room-types', dto);
    return data.data;
  },

  update: async (id: string, dto: Partial<RoomType>): Promise<RoomType> => {
    const { data } = await apiClient.put(`/room-types/${id}`, dto);
    return data.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/room-types/${id}`);
  },
};
