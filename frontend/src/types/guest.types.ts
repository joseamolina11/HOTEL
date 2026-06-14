export interface Guest {
  id: string;
  nombres: string;
  apellidos: string;
  documento: string;
  nacionalidad: string;
  telefono: string;
  email?: string;
  fechaNacimiento?: string;
  observaciones?: string;
  reservations?: import('./reservation.types').Reservation[];
}

export interface CreateGuestDto {
  nombres: string;
  apellidos: string;
  documento: string;
  nacionalidad: string;
  telefono: string;
  email?: string;
  fechaNacimiento?: string;
  observaciones?: string;
}
