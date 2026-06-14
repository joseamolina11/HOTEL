import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consumption } from './entities/consumption.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { CreateConsumptionDto, ConsumptionFilterDto } from './dto/create-consumption.dto';

@Injectable()
export class ConsumptionsService {
  constructor(
    @InjectRepository(Consumption)
    private readonly consumptionRepository: Repository<Consumption>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(InventoryItem)
    private readonly inventoryItemRepository: Repository<InventoryItem>,
  ) {}

  async findAll(filters: ConsumptionFilterDto): Promise<Consumption[]> {
    const where: any = {};
    if (filters.reservationId) {
      where.reservationId = filters.reservationId;
    }
    return this.consumptionRepository.find({
      where,
      relations: ['inventoryItem', 'reservation', 'user'],
      order: { fecha: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Consumption> {
    const consumption = await this.consumptionRepository.findOne({
      where: { id },
      relations: ['inventoryItem', 'reservation', 'reservation.room', 'user'],
    });
    if (!consumption) {
      throw new NotFoundException('Consumo no encontrado');
    }
    return consumption;
  }

  async create(createDto: CreateConsumptionDto, userId: string): Promise<Consumption> {
    const reservation = await this.reservationRepository.findOne({
      where: { id: createDto.reservationId },
    });
    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }
    if (reservation.estado !== 'checkin') {
      throw new BadRequestException('Solo se pueden registrar consumos en reservas con check-in activo');
    }

    const inventoryItem = await this.inventoryItemRepository.findOne({
      where: { id: createDto.inventoryItemId },
    });
    if (!inventoryItem) {
      throw new NotFoundException('Producto de inventario no encontrado');
    }
    if (inventoryItem.stockActual < createDto.cantidad) {
      throw new BadRequestException(
        `Stock insuficiente de ${inventoryItem.nombre}. Disponible: ${inventoryItem.stockActual}`,
      );
    }

    const precioUnitario = Number(inventoryItem.costoUnitario);
    const subtotal = precioUnitario * createDto.cantidad;

    const consumption = this.consumptionRepository.create({
      reservationId: createDto.reservationId,
      inventoryItemId: createDto.inventoryItemId,
      userId,
      cantidad: createDto.cantidad,
      precioUnitario,
      subtotal,
      fecha: createDto.fecha ? new Date(createDto.fecha) : new Date(),
    });

    await this.inventoryItemRepository.update(inventoryItem.id, {
      stockActual: inventoryItem.stockActual - createDto.cantidad,
    });

    return this.consumptionRepository.save(consumption);
  }
}
