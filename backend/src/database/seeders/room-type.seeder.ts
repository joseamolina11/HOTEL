import { RoomType } from '../../modules/room-types/entities/room-type.entity';
import { DataSource } from 'typeorm';

export async function seedRoomTypes(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(RoomType);

  const existing = await repo.count();
  if (existing > 0) return;

  const roomTypes = repo.create([
    { nombre: 'Individual', descripcion: 'Habitación individual con cama sencilla', capacidadAdultos: 1, capacidadNinos: 0, precioBase: 800, colorIdentificador: '#3B82F6', activo: true },
    { nombre: 'Doble', descripcion: 'Habitación con dos camas individuales o una matrimonial', capacidadAdultos: 2, capacidadNinos: 1, precioBase: 1200, colorIdentificador: '#10B981', activo: true },
    { nombre: 'Triple', descripcion: 'Habitación con tres camas individuales', capacidadAdultos: 3, capacidadNinos: 1, precioBase: 1600, colorIdentificador: '#F59E0B', activo: true },
    { nombre: 'Familiar', descripcion: 'Habitación amplia para toda la familia', capacidadAdultos: 2, capacidadNinos: 3, precioBase: 2000, colorIdentificador: '#8B5CF6', activo: true },
    { nombre: 'Suite', descripcion: 'Suite de lujo con sala de estar independiente', capacidadAdultos: 2, capacidadNinos: 2, precioBase: 3500, colorIdentificador: '#EF4444', activo: true },
  ]);

  await repo.save(roomTypes);
  console.log('✅ Tipos de habitación creados');
}
