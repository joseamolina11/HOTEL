export interface HotelConfig {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  pais: string;
  telefono: string;
  email: string;
  logo?: string;
  moneda: string;
  checkInTime: string;
  checkOutTime: string;
  contratoHtml?: string;
}

export interface RoomType {
  id: string;
  nombre: string;
  descripcion?: string;
  capacidadAdultos: number;
  capacidadNinos: number;
  precioBase: number;
  colorIdentificador: string;
  activo: boolean;
  amenities?: Amenity[];
}

export interface Amenity {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface CreateAmenityDto {
  nombre: string; 
  descripcion?: string
}
