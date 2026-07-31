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

  cancel: async (id: string, dto?: { motivo?: string; reembolsoMonto?: number; reembolsoMetodoPagoId?: string }): Promise<Reservation> => {
    const { data } = await apiClient.put(`/reservations/${id}/cancel`, dto || {});
    return data.data;
  },

  confirm: async (id: string): Promise<Reservation> => {
    const { data } = await apiClient.put(`/reservations/${id}/confirm`);
    return data.data;
  },

  changeRoom: async (id: string, newRoomId: string): Promise<Reservation> => {
    const { data } = await apiClient.put(`/reservations/${id}/change-room`, { newRoomId });
    return data.data;
  },

  addAbono: async (id: string, dto: { monto: number; metodoPagoId: string; comprobante?: string; observaciones?: string }): Promise<Reservation> => {
    const { data } = await apiClient.post(`/reservations/${id}/abono`, dto);
    return data.data;
  },
};
