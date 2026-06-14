import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { Reservation } from './entities/reservation.entity';
import { ReservationGuest } from './entities/reservation-guest.entity';
import { Room } from '../rooms/entities/room.entity';
import { Guest } from '../guests/entities/guest.entity';
import { RoomType } from '../room-types/entities/room-type.entity';
import { CreateReservationDto, UpdateReservationDto, CancelReservationDto, ReservationFilterDto } from './dto/create-reservation.dto';
import { generateReservationCode } from 'src/common/utils/generate-code';
import { parseLocalDate } from 'src/common/utils/date';
import { isDateOverlap } from 'src/common/utils/date-utils';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(ReservationGuest)
    private readonly reservationGuestRepository: Repository<ReservationGuest>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
  ) {}

  async findAll(filters: ReservationFilterDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const query = this.reservationRepository.createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.room', 'room')
      .leftJoinAndSelect('reservation.guest', 'guest')
      .leftJoinAndSelect('room.roomType', 'roomType')
      .skip(skip)
      .take(limit)
      .orderBy('reservation.fechaEntrada', 'DESC');

    if (filters.estado) {
      query.andWhere('reservation.estado = :estado', { estado: filters.estado });
    }
    if (filters.fechaEntrada) {
      query.andWhere('reservation.fechaEntrada >= :fechaEntrada', { fechaEntrada: new Date(filters.fechaEntrada) });
    }
    if (filters.fechaSalida) {
      query.andWhere('reservation.fechaSalida <= :fechaSalida', { fechaSalida: new Date(filters.fechaSalida) });
    }
    if (filters.search) {
      query.andWhere(
        '(guest.nombres LIKE :search OR guest.apellidos LIKE :search OR guest.documento LIKE :search OR reservation.codigo LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: [
        'room', 'room.roomType', 'room.roomType.amenities',
        'guest', 'companions',
        'checkIn', 'checkIn.user',
        'checkOut', 'checkOut.user',
        'consumptions', 'consumptions.inventoryItem',
      ],
    });
    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }
    return reservation;
  }

  async findByCode(codigo: string): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { codigo },
      relations: ['room', 'room.roomType', 'guest', 'companions'],
    });
    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }
    return reservation;
  }

  async findToday() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const arrivals = await this.reservationRepository.find({
      where: {
        fechaEntrada: Between(startOfDay, endOfDay),
        estado: 'confirmada',
      },
      relations: ['room', 'guest'],
    });

    const departures = await this.reservationRepository.find({
      where: {
        fechaSalida: Between(startOfDay, endOfDay),
        estado: 'checkin',
      },
      relations: ['room', 'guest'],
    });

    return { arrivals, departures };
  }

  async create(createDto: CreateReservationDto): Promise<Reservation> {
    const room = await this.roomRepository.findOne({
      where: { id: createDto.roomId },
      relations: ['roomType'],
    });
    if (!room) {
      throw new NotFoundException('Habitación no encontrada');
    }

    if (room.estado === 'mantenimiento') {
      throw new ConflictException('La habitación está en mantenimiento');
    }

    const guest = await this.guestRepository.findOne({
      where: { id: createDto.guestId },
    });
    if (!guest) {
      throw new NotFoundException('Huésped no encontrado');
    }

    const fechaEntrada = parseLocalDate(createDto.fechaEntrada);
    const fechaSalida = parseLocalDate(createDto.fechaSalida);

    if (fechaEntrada >= fechaSalida) {
      throw new BadRequestException('La fecha de entrada debe ser anterior a la fecha de salida');
    }

    const capacidadTotal = room.roomType.capacidadAdultos + room.roomType.capacidadNinos;
    if (createDto.cantidadHuespedes > capacidadTotal) {
      throw new BadRequestException(
        `La habitación tiene capacidad máxima de ${capacidadTotal} personas`,
      );
    }

    const overlapping = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.roomId = :roomId', { roomId: createDto.roomId })
      .andWhere('reservation.estado NOT IN (:...excludedStatuses)', {
        excludedStatuses: ['cancelada', 'checkout'],
      })
      .andWhere('reservation.fechaEntrada < :fechaSalida', { fechaSalida })
      .andWhere('reservation.fechaSalida > :fechaEntrada', { fechaEntrada })
      .getCount();

    if (overlapping > 0) {
      throw new ConflictException('La habitación ya está reservada en esas fechas');
    }

    const codigo = generateReservationCode();

    const reservation = this.reservationRepository.create({
      codigo,
      roomId: createDto.roomId,
      guestId: createDto.guestId,
      fechaEntrada,
      fechaSalida,
      cantidadHuespedes: createDto.cantidadHuespedes,
      observaciones: createDto.observaciones,
      estado: createDto.estado || 'pendiente',
      origen: 'directo',
    });

    if (createDto.companions?.length) {
      const companionRecords = [];
      for (const c of createDto.companions) {
        let guest = await this.guestRepository.findOne({ where: { documento: c.documento } });
        if (!guest) {
          guest = this.guestRepository.create({
            nombres: c.nombres,
            apellidos: c.apellidos,
            documento: c.documento,
            nacionalidad: c.nacionalidad,
            telefono: c.telefono || '',
            email: c.email || '',
          });
          guest = await this.guestRepository.save(guest);
        }
        companionRecords.push(this.reservationGuestRepository.create({
          nombres: c.nombres,
          apellidos: c.apellidos,
          documento: c.documento,
          nacionalidad: c.nacionalidad,
          telefono: c.telefono,
          email: c.email,
        }));
      }
      reservation.companions = companionRecords;
    }

    const saved = await this.reservationRepository.save(reservation);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (saved.estado === 'confirmada' && fechaEntrada.getTime() <= hoy.getTime()) {
      await this.roomRepository.update(createDto.roomId, { estado: 'reservada' });
    }

    return this.findOne(saved.id);
  }

  async update(id: string, updateDto: UpdateReservationDto): Promise<Reservation> {
    const reservation = await this.findOne(id);

    if (!['pendiente', 'confirmada'].includes(reservation.estado)) {
      throw new BadRequestException('No se puede modificar una reserva en este estado');
    }

    if (reservation.origen !== 'directo') {
      throw new BadRequestException('No se puede modificar una reserva de OTA');
    }

    if (updateDto.roomId) {
      const room = await this.roomRepository.findOne({
        where: { id: updateDto.roomId },
        relations: ['roomType'],
      });
      if (!room) throw new NotFoundException('Habitación no encontrada');
    }

    const fechaEntrada = updateDto.fechaEntrada ? parseLocalDate(updateDto.fechaEntrada) : reservation.fechaEntrada;
    const fechaSalida = updateDto.fechaSalida ? parseLocalDate(updateDto.fechaSalida) : reservation.fechaSalida;
    const roomId = updateDto.roomId || reservation.roomId;

    if (fechaEntrada >= fechaSalida) {
      throw new BadRequestException('La fecha de entrada debe ser anterior a la fecha de salida');
    }

    const overlapping = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.roomId = :roomId', { roomId })
      .andWhere('reservation.id != :id', { id })
      .andWhere('reservation.estado NOT IN (:...excludedStatuses)', {
        excludedStatuses: ['cancelada', 'checkout'],
      })
      .andWhere('reservation.fechaEntrada < :fechaSalida', { fechaSalida })
      .andWhere('reservation.fechaSalida > :fechaEntrada', { fechaEntrada })
      .getCount();

    if (overlapping > 0) {
      throw new ConflictException('La habitación ya está reservada en esas fechas');
    }

    Object.assign(reservation, updateDto);
    if (updateDto.fechaEntrada) reservation.fechaEntrada = fechaEntrada;
    if (updateDto.fechaSalida) reservation.fechaSalida = fechaSalida;

    return this.reservationRepository.save(reservation);
  }

  async cancel(id: string, cancelDto?: CancelReservationDto): Promise<Reservation> {
    const reservation = await this.findOne(id);

    if (['checkin', 'checkout', 'cancelada'].includes(reservation.estado)) {
      throw new BadRequestException('No se puede cancelar una reserva en este estado');
    }

    reservation.estado = 'cancelada';
    if (cancelDto?.motivo) {
      reservation.observaciones = cancelDto.motivo;
    }

    const saved = await this.reservationRepository.save(reservation);

    await this.roomRepository.update(reservation.roomId, { estado: 'disponible' });

    return saved;
  }

  async confirm(id: string): Promise<Reservation> {
    const reservation = await this.findOne(id);

    if (reservation.estado !== 'pendiente') {
      throw new BadRequestException('Solo se pueden confirmar reservas pendientes');
    }

    reservation.estado = 'confirmada';
    const saved = await this.reservationRepository.save(reservation);

    await this.roomRepository.update(reservation.roomId, { estado: 'reservada' });

    return saved;
  }
}
