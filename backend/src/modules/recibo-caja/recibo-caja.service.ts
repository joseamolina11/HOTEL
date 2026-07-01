import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ReciboCaja } from './entities/recibo-caja.entity';
import { ReciboCajaPago } from './entities/recibo-caja-pago.entity';
import { ReciboCajaItem } from './entities/recibo-caja-item.entity';
import { CreateReciboCajaDto, UpdateReciboCajaDto } from './dto/create-recibo-caja.dto';
import { HotelConfig } from '../hotel-config/entities/hotel-config.entity';

@Injectable()
export class ReciboCajaService {
  private readonly logger = new Logger(ReciboCajaService.name);
  constructor(
    @InjectRepository(ReciboCaja)
    private readonly repo: Repository<ReciboCaja>,
    @InjectRepository(ReciboCajaPago)
    private readonly pagosRepo: Repository<ReciboCajaPago>,
    @InjectRepository(ReciboCajaItem)
    private readonly itemsRepo: Repository<ReciboCajaItem>,
    @InjectRepository(HotelConfig)
    private readonly hotelConfigRepo: Repository<HotelConfig>,
  ) {}

  async findAll(page = 1, limit = 10) {
    const [data, total] = await this.repo.findAndCount({
      relations: ['pagos', 'pagos.metodoPago', 'items', 'reservation', 'reservation.consumptions', 'reservation.consumptions.inventoryItem', 'reservation.room', 'reservation.room.roomType', 'reservation.guest'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const r = await this.repo.findOne({
      where: { id },
      relations: ['pagos', 'pagos.metodoPago', 'items', 'reservation', 'reservation.consumptions', 'reservation.consumptions.inventoryItem', 'reservation.room', 'reservation.room.roomType', 'reservation.guest'],
    });
    if (!r) throw new NotFoundException('Recibo de caja no encontrado');
    const hotelConfig = await this.hotelConfigRepo.findOne({ where: {} });
    return { recibo: r, hotelConfig: hotelConfig || null };
  }

  private async generateCodigo(): Promise<string> {
    const now = new Date();
    const prefix = `RC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-`;
    const last = await this.repo.findOne({
      where: { codigo: Like(`${prefix}%`) },
      order: { codigo: 'DESC' },
    });
    const lastNum = last ? parseInt(last.codigo.split('-').pop() || '0', 10) : 0;
    return `${prefix}${String(lastNum + 1).padStart(4, '0')}`;
  }

  async create(dto: CreateReciboCajaDto, userId: string): Promise<ReciboCaja> {
    const codigo = await this.generateCodigo();
    const recibo = this.repo.create({
      codigo,
      clienteNombre: dto.clienteNombre,
      reservationId: dto.reservationId,
      fecha: dto.fecha,
      subtotal: dto.subtotal,
      descuento: dto.descuento ?? 0,
      total: dto.total,
      observaciones: dto.observaciones,
      createdBy: userId,
      pagos: dto.pagos.map((p) =>
        this.pagosRepo.create({
          concepto: p.concepto,
          monto: p.monto,
          metodoPagoId: p.metodoPagoId,
          cuentaId: p.cuentaId,
          referenciaTipo: p.referenciaTipo,
          referenciaId: p.referenciaId,
        }),
      ),
      items: (dto.items || []).map((i) =>
        this.itemsRepo.create({
          concepto: i.concepto,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
          subtotal: i.subtotal,
          tipo: (i.tipo as any) || 'consumo',
        }),
      ),
    });
    return this.repo.save(recibo);
  }

  async findByReservation(reservationId: string) {
    const r = await this.repo.findOne({
      where: { reservationId },
      relations: ['pagos', 'pagos.metodoPago', 'items'],
    });
    if (!r) return null;
    const hotelConfig = await this.hotelConfigRepo.findOne({ where: {} });
    return { recibo: r, hotelConfig: hotelConfig || null };
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.itemsRepo.delete({ reciboId: id });
    await this.pagosRepo.delete({ reciboId: id });
    await this.repo.delete(id);
  }
}
