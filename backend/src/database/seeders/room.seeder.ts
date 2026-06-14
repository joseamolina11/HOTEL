import { Room } from '../../modules/rooms/entities/room.entity';
import { RoomType } from '../../modules/room-types/entities/room-type.entity';
import { DataSource } from 'typeorm';

export async function seedRooms(dataSource: DataSource): Promise<void> {
  const roomRepo = dataSource.getRepository(Room);
  const roomTypeRepo = dataSource.getRepository(RoomType);

  const existing = await roomRepo.count();
  if (existing > 0) return;

  const roomTypes = await roomTypeRepo.find();

  const getRoomTypeId = (name: string) => roomTypes.find((rt) => rt.nombre === name)?.id || '';

  const rooms = roomRepo.create([
    { numero: '101', nombre: 'Individual 101', roomTypeId: getRoomTypeId('Individual'), piso: 1, estado: 'disponible' },
    { numero: '102', nombre: 'Individual 102', roomTypeId: getRoomTypeId('Individual'), piso: 1, estado: 'disponible' },
    { numero: '103', nombre: 'Doble 103', roomTypeId: getRoomTypeId('Doble'), piso: 1, estado: 'disponible' },
    { numero: '104', nombre: 'Doble 104', roomTypeId: getRoomTypeId('Doble'), piso: 1, estado: 'disponible' },
    { numero: '105', nombre: 'Triple 105', roomTypeId: getRoomTypeId('Triple'), piso: 1, estado: 'disponible' },

    { numero: '201', nombre: 'Individual 201', roomTypeId: getRoomTypeId('Individual'), piso: 2, estado: 'disponible' },
    { numero: '202', nombre: 'Doble 202', roomTypeId: getRoomTypeId('Doble'), piso: 2, estado: 'disponible' },
    { numero: '203', nombre: 'Familiar 203', roomTypeId: getRoomTypeId('Familiar'), piso: 2, estado: 'disponible' },
    { numero: '204', nombre: 'Familiar 204', roomTypeId: getRoomTypeId('Familiar'), piso: 2, estado: 'disponible' },

    { numero: '301', nombre: 'Suite 301', roomTypeId: getRoomTypeId('Suite'), piso: 3, estado: 'disponible' },
    { numero: '302', nombre: 'Suite 302', roomTypeId: getRoomTypeId('Suite'), piso: 3, estado: 'disponible' },
    { numero: '303', nombre: 'Doble 303', roomTypeId: getRoomTypeId('Doble'), piso: 3, estado: 'disponible' },
    { numero: '304', nombre: 'Triple 304', roomTypeId: getRoomTypeId('Triple'), piso: 3, estado: 'disponible' },
    { numero: '305', nombre: 'Individual 305', roomTypeId: getRoomTypeId('Individual'), piso: 3, estado: 'disponible' },
  ]);

  await roomRepo.save(rooms);
  console.log('✅ Habitaciones creadas');
}
