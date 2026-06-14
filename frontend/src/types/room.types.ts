export interface Room {
  id: string;
  numero: string;
  nombre: string;
  roomTypeId: string;
  piso: number;
  observaciones?: string;
  estado: 'disponible' | 'reservada' | 'ocupada' | 'limpieza' | 'mantenimiento';
  roomType?: import('./hotel.types').RoomType;
}

export interface CreateRoomDto {
  numero: string;
  nombre: string;
  roomTypeId: string;
  piso?: number;
  observaciones?: string;
  estado?: string;
}

export interface ChangeRoomStatusDto {
  estado: Room['estado'];
}
