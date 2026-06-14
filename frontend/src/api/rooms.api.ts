import apiClient from './client';
import { Room, CreateRoomDto, ChangeRoomStatusDto } from '@/types/room.types';

export const roomsApi = {
  findAll: async (params?: Record<string, string>) => {
    const { data } = await apiClient.get('/rooms', { params });
    return data.data;
  },

  findAvailable: async (fechaEntrada: string, fechaSalida: string): Promise<Room[]> => {
    const { data } = await apiClient.get('/rooms/available', {
      params: { fechaEntrada, fechaSalida },
    });
    return data.data;
  },

  findOne: async (id: string): Promise<Room> => {
    const { data } = await apiClient.get(`/rooms/${id}`);
    return data.data;
  },

  create: async (dto: CreateRoomDto): Promise<Room> => {
    const { data } = await apiClient.post('/rooms', dto);
    return data.data;
  },

  update: async (id: string, dto: Partial<CreateRoomDto>): Promise<Room> => {
    const { data } = await apiClient.put(`/rooms/${id}`, dto);
    return data.data;
  },

  changeStatus: async (id: string, dto: ChangeRoomStatusDto): Promise<Room> => {
    const { data } = await apiClient.put(`/rooms/${id}/status`, dto);
    return data.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/rooms/${id}`);
  },

  getCalendar: async (fechaInicio: string, fechaFin: string): Promise<any[]> => {
    const { data } = await apiClient.get('/rooms/calendar', {
      params: { fechaInicio, fechaFin },
    });
    return data.data;
  },
};
