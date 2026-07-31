import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, In } from 'typeorm';
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

  async findAll(filters?: { estado?: string; roomTypeId?: string }) {
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
    const pasadoManana = new Date(hoy.getTime() + 48 * 60 * 60 * 1000);

    const [hoyReservations, mananaReservations] = await Promise.all([
      this.reservationRepository.find({
        where: { estado: 'confirmada', fechaEntrada: Between(hoy, manana) },
        select: ['roomId'],
      }),
      this.reservationRepository.find({
        where: { estado: 'confirmada', fechaEntrada: Between(manana, pasadoManana) },
        select: ['roomId'],
      }),
    ]);

    const reservadasHoy = new Set(hoyReservations.map((r) => r.roomId));
    const reservadasManana = new Set(mananaReservations.map((r) => r.roomId));

    const reservasActivas = await this.reservationRepository.find({
      where: {
        roomId: In(rooms.map((r) => r.id)),
        estado: 'checkin',
      },
      relations: [
        'guest',
        'payments',
        'consumptions',
        'orders',
        'surcharges',
        'room',
        'room.roomType',
      ],
    });

    const activeByRoom = new Map(reservasActivas.map((r) => [r.roomId, r]));

    const computed = rooms.map((room) => {
      let computedEstado = room.estado;
      if (room.estado === 'disponible' && reservadasHoy.has(room.id)) {
        computedEstado = 'reservada';
      }

      const result: any = { ...room, estado: computedEstado };

      if (reservadasManana.has(room.id)) {
        result.tieneReservaManana = true;
      }

      const active = activeByRoom.get(room.id);
      if (active) {
        const nombres = active.guest?.nombres || '';
        const apellidos = active.guest?.apellidos || '';
        result.reservationId = active.id;
        result.fechaEntrada = active.fechaEntrada;
        result.fechaSalida = active.fechaSalida;
        result.huesped = `${nombres} ${apellidos}`.trim() || 'Sin huésped';

        const totalPagado = active.payments?.reduce((sum, p) => sum + Number(p.monto), 0) || 0;
        result.totalPagado = totalPagado;

        const noches = Math.ceil(
          (new Date(active.fechaSalida).getTime() - new Date(active.fechaEntrada).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        const precioNoche = Number(active.precioBase ?? active.room?.roomType?.precioBase ?? 0);
        const totalHabitacion = noches * precioNoche;
        const totalConsumos = active.consumptions?.reduce((sum, c) => sum + Number(c.subtotal), 0) || 0;
        const totalPedidos = active.orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
        const totalRecargos = active.surcharges?.reduce((sum, s) => sum + Number(s.subtotal), 0) || 0;
        const descuento = Number(active.descuento || 0);
        const totalEstancia = totalHabitacion + totalConsumos + totalPedidos + totalRecargos;
        result.saldoPendiente = Math.max(0, totalEstancia - totalPagado - descuento);
      }

      return result;
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
      .leftJoinAndSelect('reservation.payments', 'payments')
      .leftJoinAndSelect('reservation.surcharges', 'surcharges', 'surcharges.deleted_at IS NULL')
      .leftJoinAndSelect('reservation.room', 'calRoom')
      .leftJoinAndSelect('calRoom.roomType', 'calRoomType')
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
        reservations: roomReservations.map((r) => {
          const noches = Math.max(0, Math.ceil(
            (new Date(r.fechaSalida).getTime() - new Date(r.fechaEntrada).getTime()) /
              (1000 * 60 * 60 * 24),
          ));
          const precioNoche = Number(r.precioBase ?? r.room?.roomType?.precioBase ?? 0);
          const totalHabitacion = noches * precioNoche;
          const totalRecargos = (r.surcharges || []).reduce(
            (sum, sc) => sum + Number(sc.subtotal || 0),
            0,
          );
          const totalEstancia = totalHabitacion + totalRecargos;
          const totalPagado = (r.payments || []).reduce(
            (sum, p) => sum + Number(p.monto || 0),
            0,
          );
          const descuento = Number(r.descuento || 0);
          const saldoPendiente = Math.max(0, totalEstancia - descuento - totalPagado);
          return {
            id: r.id,
            codigo: r.codigo,
            checkinConsecutivo: r.checkinConsecutivo,
            guest: r.guest
              ? { id: r.guest.id, nombres: r.guest.nombres, apellidos: r.guest.apellidos }
              : null,
            fechaEntrada: r.fechaEntrada,
            fechaSalida: r.fechaSalida,
            estado: r.estado,
            resumen: {
              noches,
              precioPorNoche: precioNoche,
              totalHabitacion,
              totalRecargos,
              totalEstancia,
              totalPagado,
              descuento,
              saldoPendiente,
            },
          };
        }),
      };
    });
  }

  async getOccupancyControl(desde?: Date, hasta?: Date) {
    const qb = this.reservationRepository.createQueryBuilder('r')
      .leftJoinAndSelect('r.room', 'room')
      .leftJoinAndSelect('room.roomType', 'roomType')
      .leftJoinAndSelect('r.guest', 'guest')
      .leftJoinAndSelect('r.checkIn', 'checkIn')
      .leftJoinAndSelect('r.checkOut', 'checkOut')
      .leftJoinAndSelect('r.payments', 'payments')
      .leftJoinAndSelect('r.surcharges', 'surcharges', 'surcharges.deleted_at IS NULL')
      .where('r.estado IN (:...estados)', { estados: ['checkin', 'checkout'] });

    if (desde && hasta) {
      qb.andWhere('r.fechaEntrada <= :hasta AND r.fechaSalida >= :desde', { desde, hasta });
    }

    const reservations = await qb
      .orderBy('room.numero', 'ASC')
      .addOrderBy('r.fechaEntrada', 'ASC')
      .getMany();

    const rows = reservations.map((r) => {
      const noches = Math.max(0, Math.ceil(
        (new Date(r.fechaSalida).getTime() - new Date(r.fechaEntrada).getTime()) /
          (1000 * 60 * 60 * 24),
      ));
      const precioNoche = Number(r.precioBase ?? r.room?.roomType?.precioBase ?? 0);
      const valorHabitaciones = noches * precioNoche;
      const cargos = (r.surcharges || []).reduce((sum, s) => sum + Number(s.subtotal || 0), 0);
      const totalPagado = (r.payments || []).reduce((sum, p) => sum + Number(p.monto || 0), 0);
      const descuento = Number(r.descuento || 0);
      const debe = Math.max(0, valorHabitaciones + cargos - descuento - totalPagado);
      return {
        id: r.id,
        codigo: r.codigo,
        estado: r.estado,
        fechaEntrada: r.fechaEntrada,
        fechaSalida: r.fechaSalida,
        horaEntrada: r.checkIn?.fechaHora || r.fechaEntrada,
        horaSalida: r.checkOut?.fechaHora || null,
        noches,
        precioPorNoche: precioNoche,
        valorHabitaciones,
        cargos,
        descuento,
        totalPagado,
        debe,
        room: r.room
          ? { id: r.room.id, numero: r.room.numero, nombre: r.room.nombre }
          : null,
        guest: r.guest
          ? {
              id: r.guest.id,
              nombres: r.guest.nombres,
              apellidos: r.guest.apellidos,
              documento: r.guest.documento,
              telefono: r.guest.telefono,
            }
          : null,
      };
    });

    const totals = rows.reduce(
      (acc, r) => {
        if (r.estado === 'checkin') acc.ocupadas += 1;
        if (r.estado === 'checkout') acc.checkouts += 1;
        acc.valorHabitaciones += r.valorHabitaciones;
        acc.cargos += r.cargos;
        acc.debe += r.debe;
        return acc;
      },
      { ocupadas: 0, checkouts: 0, valorHabitaciones: 0, cargos: 0, debe: 0 },
    );

    return { data: rows, totals };
  }
}
