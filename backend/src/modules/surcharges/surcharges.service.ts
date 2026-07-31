import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull } from 'typeorm';
import { Surcharge } from './entities/surcharge.entity';
import { SurchargeType } from './entities/surcharge-type.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { CreateSurchargeDto, SurchargeFilterDto } from './dto/surcharge.dto';

@Injectable()
export class SurchargesService {
  constructor(
    @InjectRepository(Surcharge)
    private readonly surchargeRepository: Repository<Surcharge>,
    @InjectRepository(SurchargeType)
    private readonly surchargeTypeRepository: Repository<SurchargeType>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) {}

  async generateConsecutivo(): Promise<string> {
    const now = new Date();
    const prefix = `RCG-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-`;
    const last = await this.surchargeRepository.findOne({
      where: { consecutivo: Like(`${prefix}%`) },
      order: { consecutivo: 'DESC' },
    });
    const lastNum = last?.consecutivo ? parseInt(last.consecutivo.split('-').pop() || '0', 10) : 0;
    return `${prefix}${String(lastNum + 1).padStart(4, '0')}`;
  }

  async findAll(filters: SurchargeFilterDto): Promise<Surcharge[]> {
    const where: any = { deletedAt: IsNull() };
    if (filters.reservationId) {
      where.reservationId = filters.reservationId;
    }
    return this.surchargeRepository.find({
      where,
      relations: ['surchargeType', 'reservation', 'user', 'tercero'],
      order: { fecha: 'DESC' },
    });
  }

  async findByReservation(reservationId: string): Promise<Surcharge[]> {
    return this.surchargeRepository.find({
      where: { reservationId, deletedAt: IsNull() },
      relations: ['surchargeType', 'tercero'],
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
    const consecutivo = await this.generateConsecutivo();

    let terceroId = dto.terceroId;
    if (!terceroId && dto.surchargeTypeId) {
      const st = await this.surchargeTypeRepository.findOne({ where: { id: dto.surchargeTypeId } });
      terceroId = st?.terceroId;
    }

    const surcharge = this.surchargeRepository.create({
      reservationId: dto.reservationId,
      surchargeTypeId: dto.surchargeTypeId,
      terceroId,
      consecutivo,
      referencia: dto.referencia,
      descripcion: dto.descripcion,
      monto: dto.monto,
      cantidad,
      subtotal,
      fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
      userId,
    });

    return this.surchargeRepository.save(surcharge);
  }

  async update(id: string, dto: Partial<CreateSurchargeDto>): Promise<Surcharge> {
    const s = await this.surchargeRepository.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Recargo no encontrado');
    if (s.estado === 'cargado') throw new BadRequestException('No se puede modificar un recargo que ya fue cargado');
    if (dto.monto) s.monto = dto.monto;
    if (dto.descripcion) s.descripcion = dto.descripcion;
    if (dto.cantidad) s.cantidad = dto.cantidad;
    if (dto.terceroId !== undefined) s.terceroId = dto.terceroId;
    if (dto.referencia !== undefined) s.referencia = dto.referencia;
    s.subtotal = s.monto * s.cantidad;
    return this.surchargeRepository.save(s);
  }

  async remove(id: string): Promise<void> {
    const s = await this.surchargeRepository.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Recargo no encontrado');
    if (s.estado === 'cargado') throw new BadRequestException('No se puede eliminar un recargo que ya fue cargado');
    s.deletedAt = new Date();
    await this.surchargeRepository.save(s);
  }

  async getTotalByReservation(reservationId: string): Promise<number> {
    const surcharges = await this.findByReservation(reservationId);
    return surcharges.reduce((sum, s) => sum + Number(s.subtotal), 0);
  }
}
