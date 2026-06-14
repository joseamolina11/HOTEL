import apiClient from './client';
import { Reservation, CreateReservationDto } from '@/types/reservation.types';

export const reservationsApi = {
  findAll: async (params?: Record<string, string>) => {
    const { data } = await apiClient.get('/reservations', { params });
    return data;
  },

  findToday: async () => {
    const { data } = await apiClient.get('/reservations/today');
    return data.data;
  },

  findOne: async (id: string): Promise<Reservation> => {
    const { data } = await apiClient.get(`/reservations/${id}`);
    return data.data;
  },

  findByCode: async (codigo: string): Promise<Reservation> => {
    const { data } = await apiClient.get(`/reservations/code/${codigo}`);
    return data.data;
  },

  create: async (dto: CreateReservationDto): Promise<Reservation> => {
    const { data } = await apiClient.post('/reservations', dto);
    return data.data;
  },

  update: async (id: string, dto: Partial<CreateReservationDto>): Promise<Reservation> => {
    const { data } = await apiClient.put(`/reservations/${id}`, dto);
    return data.data;
  },

  cancel: async (id: string, motivo?: string): Promise<Reservation> => {
    const { data } = await apiClient.put(`/reservations/${id}/cancel`, { motivo });
    return data.data;
  },

  confirm: async (id: string): Promise<Reservation> => {
    const { data } = await apiClient.put(`/reservations/${id}/confirm`);
    return data.data;
  },
};
