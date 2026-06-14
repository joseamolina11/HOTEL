import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CheckIn } from './entities/check-in.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { ReservationGuest } from '../reservations/entities/reservation-guest.entity';
import { Guest } from '../guests/entities/guest.entity';
import { Room } from '../rooms/entities/room.entity';
import { CheckInDto } from './dto/check-in.dto';

@Injectable()
export class CheckInService {
  constructor(
    @InjectRepository(CheckIn)
    private readonly checkInRepository: Repository<CheckIn>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(ReservationGuest)
    private readonly reservationGuestRepository: Repository<ReservationGuest>,
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async findPendingCheckIns() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    return this.reservationRepository.find({
      where: {
        fechaEntrada: Between(startOfDay, endOfDay),
        estado: 'confirmada',
      },
      relations: ['room', 'room.roomType', 'guest', 'companions'],
      order: { fechaEntrada: 'ASC' },
    });
  }

  async checkIn(checkInDto: CheckInDto, userId: string): Promise<CheckIn | null> {
    const reservation = await this.reservationRepository.findOne({
      where: { id: checkInDto.reservationId },
      relations: ['room'],
    });

    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (reservation.estado !== 'confirmada') {
      throw new BadRequestException(
        `La reserva debe estar confirmada para hacer check-in (estado actual: ${reservation.estado})`,
      );
    }

    const existingCheckIn = await this.checkInRepository.findOne({
      where: { reservationId: checkInDto.reservationId },
    });
    if (existingCheckIn) {
      throw new ConflictException('Esta reserva ya tiene un check-in registrado');
    }

    if (!['disponible', 'reservada'].includes(reservation.room.estado)) {
      throw new ConflictException(
        `La habitación no está disponible (estado: ${reservation.room.estado})`,
      );
    }

    if (checkInDto.companions?.length) {
      const existingDocs = (
        await this.reservationGuestRepository.find({
          where: { reservationId: checkInDto.reservationId },
        })
      ).map((rg) => rg.documento);

      const newRecords = [];
      for (const c of checkInDto.companions) {
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
        if (!existingDocs.includes(c.documento)) {
          newRecords.push(
            this.reservationGuestRepository.create({
              nombres: c.nombres,
              apellidos: c.apellidos,
              documento: c.documento,
              nacionalidad: c.nacionalidad,
              telefono: c.telefono,
              email: c.email,
              reservationId: checkInDto.reservationId,
            }),
          );
        }
      }
      if (newRecords.length) {
        await this.reservationGuestRepository.save(newRecords);
      }
    }

    const checkIn = this.checkInRepository.create({
      reservationId: checkInDto.reservationId,
      userId,
      fechaHora: new Date(),
      observaciones: checkInDto.observaciones,
    });

    await this.checkInRepository.save(checkIn);
    await this.reservationRepository.update(reservation.id, { estado: 'checkin' });
    await this.roomRepository.update(reservation.roomId, { estado: 'ocupada' });

    return this.checkInRepository.findOne({
      where: { id: checkIn.id },
      relations: ['reservation', 'reservation.room', 'reservation.guest', 'user'],
    });
  }

  async findByReservation(reservationId: string): Promise<CheckIn> {
    const checkIn = await this.checkInRepository.findOne({
      where: { reservationId },
      relations: ['reservation', 'reservation.room', 'reservation.guest', 'user'],
    });
    if (!checkIn) {
      throw new NotFoundException('Check-in no encontrado para esta reserva');
    }
    return checkIn;
  }
}
