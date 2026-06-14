import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between } from 'typeorm';
import { Room } from './entities/room.entity';
import { RoomType } from '../room-types/entities/room-type.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { CreateRoomDto, UpdateRoomDto } from './dto/create-room.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(RoomType)
    private readonly roomTypeRepository: Repository<RoomType>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) {}

  async findAll(filters?: { estado?: string; roomTypeId?: string }): Promise<Room[]> {
    const where: FindOptionsWhere<Room> = {};
    if (filters?.roomTypeId) where.roomTypeId = filters.roomTypeId;

    const rooms = await this.roomRepository.find({
      where,
      relations: ['roomType', 'roomType.amenities'],
      order: { piso: 'ASC', numero: 'ASC' },
    });

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy.getTime() + 24 * 60 * 60 * 1000);

    const hoyReservations = await this.reservationRepository.find({
      where: {
        estado: 'confirmada',
        fechaEntrada: Between(hoy, manana),
      },
      select: ['roomId'],
    });

    const reservadasHoy = new Set(hoyReservations.map((r) => r.roomId));

    const computed = rooms.map((room) => {
      if (room.estado === 'disponible' && reservadasHoy.has(room.id)) {
        return { ...room, estado: 'reservada' as const };
      }
      return room;
    });

    if (filters?.estado) {
      return computed.filter((r) => r.estado === filters.estado);
    }

    return computed;
  }

  async findAvailable(fechaEntrada: Date, fechaSalida: Date): Promise<Room[]> {
    if (fechaEntrada >= fechaSalida) {
      throw new BadRequestException('La fecha de entrada debe ser anterior a la fecha de salida');
    }

    const occupiedRoomIds = await this.roomRepository
      .createQueryBuilder('room')
      .innerJoin('room.reservations', 'reservation')
      .where('reservation.estado NOT IN (:...excludedStatuses)', {
        excludedStatuses: ['cancelada', 'checkout'],
      })
      .andWhere('reservation.fecha_entrada < :fechaSalida', { fechaSalida })
      .andWhere('reservation.fecha_salida > :fechaEntrada', { fechaEntrada })
      .select('room.id')
      .getRawMany();

    const excludedIds = occupiedRoomIds.map((r) => r.room_id);

    const query = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.roomType', 'roomType')
      .leftJoinAndSelect('roomType.amenities', 'amenities')
      .where('room.estado IN (:...availableStatuses)', {
        availableStatuses: ['disponible', 'reservada'],
      });

    if (excludedIds.length > 0) {
      query.andWhere('room.id NOT IN (:...excludedIds)', { excludedIds });
    }

    return query.orderBy('room.piso', 'ASC').addOrderBy('room.numero', 'ASC').getMany();
  }

  async findOne(id: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['roomType', 'roomType.amenities'],
    });
    if (!room) {
      throw new NotFoundException('Habitación no encontrada');
    }
    return room;
  }

  async create(createDto: CreateRoomDto): Promise<Room> {
    const roomType = await this.roomTypeRepository.findOne({
      where: { id: createDto.roomTypeId },
    });
    if (!roomType) {
      throw new NotFoundException('Tipo de habitación no encontrado');
    }

    const existingRoom = await this.roomRepository.findOne({
      where: { numero: createDto.numero },
    });
    if (existingRoom) {
      throw new ConflictException('Ya existe una habitación con ese número');
    }

    const room = this.roomRepository.create({
      ...createDto,
      estado: (createDto.estado as any) || 'disponible',
    });
    return this.roomRepository.save(room);
  }

  async update(id: string, updateDto: UpdateRoomDto): Promise<Room> {
    const room = await this.findOne(id);

    if (updateDto.roomTypeId) {
      const roomType = await this.roomTypeRepository.findOne({
        where: { id: updateDto.roomTypeId },
      });
      if (!roomType) {
        throw new NotFoundException('Tipo de habitación no encontrado');
      }
    }

    Object.assign(room, updateDto);
    return this.roomRepository.save(room);
  }

  async changeStatus(id: string, estado: Room['estado']): Promise<Room> {
    const room = await this.findOne(id);
    room.estado = estado;
    return this.roomRepository.save(room);
  }

  async remove(id: string): Promise<void> {
    const room = await this.findOne(id);
    if (room.estado === 'ocupada') {
      throw new ConflictException('No se puede eliminar una habitación ocupada');
    }
    await this.roomRepository.remove(room);
  }

  async getCalendar(fechaInicio: Date, fechaFin: Date) {
    const rooms = await this.roomRepository.find({
      relations: ['roomType', 'roomType.amenities'],
      order: { piso: 'ASC', numero: 'ASC' },
    });

    const reservations = await this.reservationRepository
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.guest', 'guest')
      .leftJoinAndSelect('reservation.companions', 'companions')
      .where('reservation.estado NOT IN (:...excluded)', {
        excluded: ['cancelada', 'checkout'],
      })
      .andWhere('reservation.fechaEntrada < :fechaFin', { fechaFin })
      .andWhere('reservation.fechaSalida > :fechaInicio', { fechaInicio })
      .orderBy('reservation.fechaEntrada', 'ASC')
      .getMany();

    const reservationsByRoom = new Map<string, typeof reservations>();
    for (const res of reservations) {
      const arr = reservationsByRoom.get(res.roomId) || [];
      arr.push(res);
      reservationsByRoom.set(res.roomId, arr);
    }

    return rooms.map((room) => {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const roomReservations = reservationsByRoom.get(room.id) || [];
      const hasTodayReservation = roomReservations.some(
        (r) =>
          r.estado === 'confirmada' &&
          r.fechaEntrada.getTime() <= hoy.getTime() &&
          r.fechaSalida.getTime() > hoy.getTime(),
      );
      const currentStatus = room.estado === 'disponible' && hasTodayReservation
        ? 'reservada' as const
        : room.estado;
      return {
        id: room.id,
        numero: room.numero,
        nombre: room.nombre,
        piso: room.piso,
        estado: currentStatus,
        roomType: room.roomType,
        reservations: roomReservations.map((r) => ({
          id: r.id,
          codigo: r.codigo,
          guest: r.guest
            ? { id: r.guest.id, nombres: r.guest.nombres, apellidos: r.guest.apellidos }
            : null,
          fechaEntrada: r.fechaEntrada,
          fechaSalida: r.fechaSalida,
          estado: r.estado,
        })),
      };
    });
  }
}
