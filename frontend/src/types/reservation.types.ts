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
  precioBase?: number | null;
  descuento?: number;
  contratoFileId?: string;
  contratoFile?: { id: string; url: string; originalName: string; mimeType: string; size: number };
  room?: Room;
  guest?: Guest;
  companions?: ReservationCompanion[];
  consumptions?: any[];
  orders?: any[];
  payments?: any[];
  surcharges?: any[];
  recibosCaja?: any[];
  checkIn?: any;
  checkOut?: any;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  oficio?: string;
  empresa?: string;
  telefonoContacto?: string;
  emailContacto?: string;
  transporteLlegada?: string;
  transporteSalida?: string;
  reservacionOrigen?: string;
  procedencia?: string;
  destino?: string;
  motivoViaje?: string;
  numeroPlaca?: string;
}

export interface CreateReservationDto {
  roomId: string;
  guestId: string;
  fechaEntrada: string;
  fechaSalida: string;
  cantidadHuespedes: number;
  observaciones?: string;
  contratoFileId?: string;
  estado?: string;
  companions?: ReservationCompanion[];
}
