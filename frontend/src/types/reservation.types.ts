import { Room } from './room.types';
import { Guest } from './guest.types';

export interface ReservationCompanion {
  id?: string;
  nombres: string;
  apellidos: string;
  documento: string;
  nacionalidad: string;
  telefono?: string;
  email?: string;
}

export interface Reservation {
  id: string;
  codigo: string;
  roomId: string;
  guestId: string;
  fechaEntrada: string;
  fechaSalida: string;
  cantidadHuespedes: number;
  observaciones?: string;
  estado: 'pendiente' | 'confirmada' | 'checkin' | 'checkout' | 'cancelada';
  origen: 'directo' | 'booking' | 'airbnb';
  otaReservationId?: string;
  room?: Room;
  guest?: Guest;
  companions?: ReservationCompanion[];
}

export interface CreateReservationDto {
  roomId: string;
  guestId: string;
  fechaEntrada: string;
  fechaSalida: string;
  cantidadHuespedes: number;
  observaciones?: string;
  estado?: string;
  companions?: ReservationCompanion[];
}
