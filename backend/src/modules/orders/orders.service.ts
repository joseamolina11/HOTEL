import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { Room } from '../rooms/entities/room.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(InventoryItem)
    private readonly inventoryRepo: Repository<InventoryItem>,
    @InjectRepository(InventoryMovement)
    private readonly movementRepo: Repository<InventoryMovement>,
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
  ) {}

  async findAll(filters?: { roomId?: string; estado?: string }, page = 1, limit = 10) {
    const where: any = {};
    if (filters?.roomId) where.roomId = filters.roomId;
    if (filters?.estado) where.estado = filters.estado;

    const [data, total] = await this.orderRepo.findAndCount({
      where,
      relations: ['room', 'guest', 'user', 'items', 'items.inventoryItem'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByRoom(roomId: string) {
    return this.orderRepo.find({
      where: { roomId },
      relations: ['items', 'items.inventoryItem', 'guest', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['room', 'guest', 'user', 'items', 'items.inventoryItem'],
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    return order;
  }

  async generateCodigo(): Promise<string> {
    const date = new Date();
    const prefix = `PED-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-`;
    const last = await this.orderRepo
      .createQueryBuilder('order')
      .where('order.codigo LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('order.codigo', 'DESC')
      .getOne();

    let next = 1;
    if (last) {
      const parts = last.codigo.split('-');
      next = parseInt(parts[parts.length - 1], 10) + 1;
    }
    return `${prefix}${String(next).padStart(4, '0')}`;
  }

  async create(dto: CreateOrderDto, userId: string) {
    const room = await this.roomRepo.findOne({ where: { id: dto.roomId } });
    if (!room) throw new NotFoundException('Habitación no encontrada');

    let reservationId = dto.reservationId;
    if (!reservationId) {
      const activeReservation = await this.reservationRepo.findOne({
        where: { roomId: dto.roomId, estado: 'checkin' },
        order: { fechaEntrada: 'DESC' },
      });
      if (activeReservation) reservationId = activeReservation.id;
    }

    const codigo = await this.generateCodigo();
    let total = 0;
    const itemsData: (Partial<OrderItem> & { _stockAnterior: number; _stockPosterior: number })[] = [];

    for (const itemDto of dto.items) {
      const product = await this.inventoryRepo.findOne({ where: { id: itemDto.inventoryItemId } });
      if (!product) throw new NotFoundException(`Producto ${itemDto.inventoryItemId} no encontrado`);

      if (product.stockActual < itemDto.cantidad) {
        throw new BadRequestException(`Stock insuficiente para ${product.nombre}: disponible ${product.stockActual}, solicitado ${itemDto.cantidad}`);
      }

      const subtotal = itemDto.cantidad * itemDto.precioUnitario;
      total += subtotal;

      const stockAnterior = product.stockActual;
      product.stockActual -= itemDto.cantidad;
      await this.inventoryRepo.save(product);

      itemsData.push({
        inventoryItemId: itemDto.inventoryItemId,
        cantidad: itemDto.cantidad,
        precioUnitario: itemDto.precioUnitario,
        subtotal,
        _stockAnterior: stockAnterior,
        _stockPosterior: product.stockActual,
      });
    }

    const order = this.orderRepo.create({
      roomId: dto.roomId,
      reservationId,
      guestId: dto.guestId,
      userId,
      codigo,
      fecha: new Date(),
      total,
      estado: 'pendiente',
      observaciones: dto.observaciones,
      items: itemsData as unknown as OrderItem[],
    });

    const saved = await this.orderRepo.save(order);

    const movements = itemsData.map((item) =>
      this.movementRepo.create({
        inventoryItemId: item.inventoryItemId,
        userId,
        tipo: 'salida' as const,
        cantidad: item.cantidad,
        stockAnterior: item._stockAnterior,
        stockPosterior: item._stockPosterior,
        precioUnitario: item.precioUnitario ?? 0,
        observaciones: `Pedido ${codigo}`,
      }),
    );

    if (movements.length > 0) {
      await this.movementRepo.save(movements);
    }

    return saved;
  }

  async cancel(id: string) {
    const order = await this.findOne(id);
    if (order.estado === 'cancelado') throw new BadRequestException('El pedido ya está cancelado');

    for (const item of order.items) {
      const product = await this.inventoryRepo.findOne({ where: { id: item.inventoryItemId } });
      if (product) {
        const stockAnterior = product.stockActual;
        product.stockActual += item.cantidad;
        await this.inventoryRepo.save(product);

        await this.movementRepo.save(
          this.movementRepo.create({
            inventoryItemId: item.inventoryItemId,
            userId: order.userId,
            tipo: 'entrada' as const,
            cantidad: item.cantidad,
            stockAnterior,
            stockPosterior: product.stockActual,
            precioUnitario: item.precioUnitario ?? 0,
            observaciones: `Cancelación pedido ${order.codigo}`,
          }),
        );
      }
    }

    order.estado = 'cancelado';
    return this.orderRepo.save(order);
  }

  async getPendingByRoom() {
    const orders = await this.orderRepo.find({
      where: { estado: 'pendiente' },
      relations: ['room', 'guest', 'items', 'items.inventoryItem'],
      order: { createdAt: 'DESC' },
    });

    const grouped = new Map<string, { room: any; guest: any; total: number; orders: Order[] }>();
    for (const order of orders) {
      const key = order.roomId;
      if (!grouped.has(key)) {
        grouped.set(key, {
          room: order.room,
          guest: order.guest,
          total: 0,
          orders: [],
        });
      }
      const group = grouped.get(key)!;
      group.total += Number(order.total);
      group.orders.push(order);
    }

    return Array.from(grouped.values());
  }

  async getTotalsByDateRange(fechaInicio: Date, fechaFin: Date): Promise<{
    total: number;
    count: number;
    paid: number;
    pending: number;
  }> {
    const orders = await this.orderRepo.find({
      where: {
        fecha: Between(fechaInicio, fechaFin),
      },
    });

    const result = { total: 0, count: 0, paid: 0, pending: 0 };
    for (const o of orders) {
      result.total += Number(o.total);
      result.count++;
      if (o.estado === 'pagado') result.paid += Number(o.total);
      else if (o.estado === 'pendiente') result.pending += Number(o.total);
    }
    return result;
  }
}
