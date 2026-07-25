import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Surcharge } from './entities/surcharge.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { CreateSurchargeDto, SurchargeFilterDto } from './dto/surcharge.dto';

@Injectable()
export class SurchargesService {
  constructor(
    @InjectRepository(Surcharge)
    private readonly surchargeRepository: Repository<Surcharge>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) {}

  async findAll(filters: SurchargeFilterDto): Promise<Surcharge[]> {
    const where: any = {};
    if (filters.reservationId) {
      where.reservationId = filters.reservationId;
    }
    return this.surchargeRepository.find({
      where,
      relations: ['surchargeType', 'reservation', 'user'],
      order: { fecha: 'DESC' },
    });
  }

  async findByReservation(reservationId: string): Promise<Surcharge[]> {
    return this.surchargeRepository.find({
      where: { reservationId },
      relations: ['surchargeType'],
      order: { fecha: 'ASC' },
    });
  }

  async create(dto: CreateSurchargeDto, userId?: string): Promise<Surcharge> {
    const reservation = await this.reservationRepository.findOne({ where: { id: dto.reservationId } });
    if (!reservation) throw new NotFoundException('Reserva no encontrada');
    if (!['checkin', 'confirmada'].includes(reservation.estado)) {
      throw new BadRequestException('Solo se pueden agregar recargos en reservas activas o confirmadas');
    }

    const cantidad = dto.cantidad || 1;
    const subtotal = dto.monto * cantidad;

    const surcharge = this.surchargeRepository.create({
      reservationId: dto.reservationId,
      surchargeTypeId: dto.surchargeTypeId,
      descripcion: dto.descripcion,
      monto: dto.monto,
      cantidad,
      subtotal,
      fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
      userId,
    });

    return this.surchargeRepository.save(surcharge);
  }

  async remove(id: string): Promise<void> {
    const s = await this.surchargeRepository.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Recargo no encontrado');
    await this.surchargeRepository.remove(s);
  }

  async getTotalByReservation(reservationId: string): Promise<number> {
    const surcharges = await this.findByReservation(reservationId);
    return surcharges.reduce((sum, s) => sum + Number(s.subtotal), 0);
  }
}
