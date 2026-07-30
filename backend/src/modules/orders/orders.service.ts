import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DeepPartial, IsNull } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { Room } from '../rooms/entities/room.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { CashRegister } from '../cash-register/entities/cash-register.entity';
import { Payment } from '../payments/entities/payment.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ReciboCajaService } from '../recibo-caja/recibo-caja.service';
import { FinancialMovementsService } from '../financial-movements/financial-movements.service';
import { PaymentMethodsService } from '../payment-methods/payment-methods.service';

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
    @InjectRepository(CashRegister)
    private readonly cashRegisterRepo: Repository<CashRegister>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly reciboCajaService: ReciboCajaService,
    private readonly financialMovementsService: FinancialMovementsService,
    private readonly paymentMethodsService: PaymentMethodsService,
  ) {}

  async findAll(filters?: { roomId?: string; estado?: string; reservationId?: string }, page = 1, limit = 10) {
    const where: any = {};
    if (filters?.roomId) where.roomId = filters.roomId;
    if (filters?.estado) where.estado = filters.estado;
    if (filters?.reservationId) where.reservationId = filters.reservationId;

    const [data, total] = await this.orderRepo.findAndCount({
      where,
      relations: ['room', 'guest', 'user', 'items', 'items.inventoryItem', 'annulledBy'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByRoom(roomId: string) {
    const activeReservation = await this.reservationRepo.findOne({
      where: { roomId, estado: 'checkin' },
      order: { fechaEntrada: 'DESC' },
    });

    if (!activeReservation) return [];

    const orders = await this.orderRepo.find({
      where: [
        { reservationId: activeReservation.id },
        { roomId, reservationId: IsNull() },
      ],
      relations: ['items', 'items.inventoryItem', 'guest', 'user'],
      order: { createdAt: 'DESC' },
    });

    return {
      orders,
      reservationId: activeReservation.id,
    };
  }

  async findOne(id: string) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['room', 'guest', 'user', 'items', 'items.inventoryItem', 'annulledBy'],
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
    const isDirectSale = dto.ventaDirecta || !dto.roomId;

    let roomId = dto.roomId;
    let reservationId = dto.reservationId;

    if (!isDirectSale) {
      const room = await this.roomRepo.findOne({ where: { id: dto.roomId } });
      if (!room) throw new NotFoundException('Habitación no encontrada');

      if (!reservationId) {
        const activeReservation = await this.reservationRepo.findOne({
          where: { roomId: dto.roomId, estado: 'checkin' },
          order: { fechaEntrada: 'DESC' },
        });
        if (activeReservation) reservationId = activeReservation.id;
      }
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
      roomId: roomId || undefined,
      reservationId,
      guestId: dto.guestId,
      userId,
      codigo,
      fecha: new Date(),
      total,
      estado: 'borrador' as const,
      observaciones: dto.observaciones,
      items: itemsData as unknown as OrderItem[],
    } as DeepPartial<Order>);

    const saved = await this.orderRepo.save(order) as Order;

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

    // Direct sale: always create Recibo de Caja + Financial Movements
    if (isDirectSale) {
      const pagos = dto.pagos?.length ? dto.pagos : (dto.pagoMetodoPagoId && dto.pagoMonto && dto.pagoMonto > 0
        ? [{ monto: dto.pagoMonto, metodoPagoId: dto.pagoMetodoPagoId }]
        : []);
      await this.processDirectSalePayment(saved, dto, userId, pagos);
    }

    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateOrderDto, userId: string) {
    const order = await this.findOne(id);
    if (order.estado === 'cargado') {
      throw new BadRequestException('No se puede editar un pedido que ya fue cargado');
    }
    if (order.estado !== 'borrador' && order.estado !== 'pendiente') {
      throw new BadRequestException('Solo se pueden editar pedidos en borrador o pendientes');
    }

    if (dto.items) {
      const oldItems = [...order.items];

      for (const newItem of dto.items) {
        const oldItem = oldItems.find(i => i.inventoryItemId === newItem.inventoryItemId);
        const oldQty = oldItem?.cantidad || 0;
        const diff = newItem.cantidad - oldQty;

        if (diff !== 0) {
          const product = await this.inventoryRepo.findOne({ where: { id: newItem.inventoryItemId } });
          if (!product) throw new NotFoundException(`Producto ${newItem.inventoryItemId} no encontrado`);

          if (diff > 0) {
            if (product.stockActual < diff) {
              throw new BadRequestException(`Stock insuficiente para ${product.nombre}: disponible ${product.stockActual}, necesita ${diff}`);
            }
          }

          const stockAnterior = product.stockActual;
          product.stockActual -= diff;
          await this.inventoryRepo.save(product);

          await this.movementRepo.save(this.movementRepo.create({
            inventoryItemId: newItem.inventoryItemId,
            userId,
            tipo: diff > 0 ? 'salida' : 'entrada',
            cantidad: Math.abs(diff),
            stockAnterior,
            stockPosterior: product.stockActual,
            precioUnitario: newItem.precioUnitario || 0,
            observaciones: `Ajuste ${diff > 0 ? 'aumento' : 'reducción'} pedido ${order.codigo}`,
          }));
        }
      }

      for (const oldItem of oldItems) {
        const stillExists = dto.items.find(i => i.inventoryItemId === oldItem.inventoryItemId);
        if (!stillExists) {
          const product = await this.inventoryRepo.findOne({ where: { id: oldItem.inventoryItemId } });
          if (product) {
            product.stockActual += oldItem.cantidad;
            await this.inventoryRepo.save(product);

            await this.movementRepo.save(this.movementRepo.create({
              inventoryItemId: oldItem.inventoryItemId,
              userId,
              tipo: 'entrada',
              cantidad: oldItem.cantidad,
              stockAnterior: product.stockActual - oldItem.cantidad,
              stockPosterior: product.stockActual,
              precioUnitario: oldItem.precioUnitario || 0,
              observaciones: `Eliminado de pedido ${order.codigo}`,
            }));
          }
        }
      }

      await this.orderItemRepo.delete({ orderId: id });

      if (dto.items.length > 0) {
        const newItems = dto.items.map(i =>
          this.orderItemRepo.create({
            orderId: id,
            inventoryItemId: i.inventoryItemId,
            cantidad: i.cantidad,
            precioUnitario: i.precioUnitario,
            subtotal: i.cantidad * i.precioUnitario,
          }),
        );
        await this.orderItemRepo.save(newItems);
      }

      order.total = dto.items.reduce((sum, i) => sum + i.cantidad * i.precioUnitario, 0);
    }

    const updateFields: Record<string, any> = {};

    if (dto.items) {
      updateFields.total = order.total;
    }

    if (dto.roomId !== undefined) {
      if (!dto.roomId) {
        updateFields.roomId = null;
        updateFields.reservationId = null;
      } else {
        const room = await this.roomRepo.findOne({ where: { id: dto.roomId } });
        if (!room) throw new NotFoundException('Habitación no encontrada');
        updateFields.roomId = dto.roomId;

        const activeReservation = await this.reservationRepo.findOne({
          where: { roomId: dto.roomId, estado: 'checkin' },
          order: { fechaEntrada: 'DESC' },
        });
        updateFields.reservationId = activeReservation?.id || null;
      }
    }

    if (dto.observaciones !== undefined) {
      updateFields.observaciones = dto.observaciones;
    }

    if (Object.keys(updateFields).length > 0) {
      await this.orderRepo.update(id, updateFields);
    }
    return this.findOne(id);
  }

  private async processDirectSalePayment(
    order: Order,
    dto: CreateOrderDto,
    userId: string,
    pagos: { monto: number; metodoPagoId: string }[],
  ) {
    const cashRegister = await this.cashRegisterRepo.findOne({ where: { estado: 'abierta' } });

    const orderWithItems = await this.orderRepo.findOne({
      where: { id: order.id },
      relations: ['items', 'items.inventoryItem'],
    });

    const totalPagado = pagos.reduce((sum, p) => sum + p.monto, 0);
    const isPaid = totalPagado > 0;

    // Build items for recibo
    const itemsData = (orderWithItems?.items || []).map((item: any) => ({
      concepto: item.inventoryItem?.nombre || 'Producto',
      cantidad: item.cantidad,
      precioUnitario: Number(item.precioUnitario),
      subtotal: Number(item.subtotal),
      tipo: 'pedido' as const,
    }));

    // Process each payment split
    const pagosRecibo: any[] = [];
    for (const split of pagos) {
      const pm = await this.paymentMethodsService.findOne(split.metodoPagoId);

      const payment = await this.paymentRepo.save(
        this.paymentRepo.create({
          orderId: order.id,
          userId,
          monto: split.monto,
          metodoPagoId: split.metodoPagoId,
          observaciones: `Venta directa ${order.codigo} - ${pm.nombre}`,
          fecha: new Date(),
        }),
      );

      pagosRecibo.push({
        concepto: `Venta directa ${order.codigo} - ${pm.nombre}`,
        monto: split.monto,
        metodoPagoId: pm.id,
        cuentaId: pm.financialAccountId || '',
        referenciaTipo: 'payment',
        referenciaId: payment.id,
      });

      if (isPaid && pm.financialAccountId) {
        try {
          await this.financialMovementsService.create({
            accountId: pm.financialAccountId,
            tipo: 'INGRESO',
            monto: split.monto,
            concepto: `Venta directa ${order.codigo} - ${pm.nombre}`,
            referenciaTipo: 'order',
            referenciaId: order.id,
            cashRegisterId: cashRegister?.id,
          }, userId);
        } catch (e: any) { /* skip */ }
      }

      if (isPaid && cashRegister) {
        const tipo = pm.tipo || 'otros';
        cashRegister.totalVentas = Number(cashRegister.totalVentas) + split.monto;
        if (tipo === 'efectivo') cashRegister.totalEfectivo = Number(cashRegister.totalEfectivo) + split.monto;
        else if (tipo === 'transferencia') cashRegister.totalTransferencia = Number(cashRegister.totalTransferencia) + split.monto;
        else if (tipo === 'tarjeta') cashRegister.totalTarjeta = Number(cashRegister.totalTarjeta) + split.monto;
        else cashRegister.totalOtros = Number(cashRegister.totalOtros) + split.monto;
        cashRegister.cantidadTransacciones += 1;
        await this.cashRegisterRepo.save(cashRegister);
      }
    }

    const recibo = await this.reciboCajaService.create({
      clienteNombre: dto.clienteNombre || 'Venta directa',
      fecha: new Date().toISOString().slice(0, 10),
      subtotal: totalPagado || order.total,
      descuento: 0,
      total: totalPagado || 0,
      pagos: pagosRecibo,
      items: itemsData,
    }, userId);

    if (isPaid) {
      await this.orderRepo.update(order.id, { estado: 'pagado', reciboId: recibo.id });
    }
  }

  async cancel(id: string, userId?: string) {
    const order = await this.findOne(id);
    if (order.estado === 'cancelado') throw new BadRequestException('El pedido ya está cancelado');
    if (order.estado === 'cargado') throw new BadRequestException('No se puede cancelar un pedido que ya fue cargado');

    // Reverse inventory
    for (const item of order.items) {
      const product = await this.inventoryRepo.findOne({ where: { id: item.inventoryItemId } });
      if (product) {
        const stockAnterior = product.stockActual;
        product.stockActual += item.cantidad;
        await this.inventoryRepo.save(product);

        await this.movementRepo.save(
          this.movementRepo.create({
            inventoryItemId: item.inventoryItemId,
            userId: userId || order.userId,
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

    // Reverse financial movements and annul receipt if order was paid
    if (order.estado === 'pagado' && order.reciboId) {
      try {
        // Find the receipt
        const { recibo } = await this.reciboCajaService.findOne(order.reciboId);

        // Create reverse financial movements for each payment in the receipt
        const cashRegister = await this.cashRegisterRepo.findOne({ where: { estado: 'abierta' } });
        for (const pago of recibo.pagos || []) {
          if (pago.cuentaId) {
            try {
              await this.financialMovementsService.create({
                accountId: pago.cuentaId,
                tipo: 'EGRESO',
                monto: Number(pago.monto),
                concepto: `Anulación pedido ${order.codigo} - reverso`,
                referenciaTipo: 'order_cancel',
                referenciaId: order.id,
                reciboId: order.reciboId,
                cashRegisterId: cashRegister?.id,
              }, userId || order.userId);
            } catch (e: any) {
              // skip
            }
          }
        }

        // Update cash register (subtract amounts)
        if (cashRegister) {
          const totalPaid = Number(order.total);
          cashRegister.totalVentas = Math.max(0, Number(cashRegister.totalVentas) - totalPaid);
          // We can't easily know exact split by payment type, so just reduce total
          cashRegister.cantidadTransacciones = Math.max(0, cashRegister.cantidadTransacciones - 1);
          await this.cashRegisterRepo.save(cashRegister);
        }

        // Annul the receipt
        await this.reciboCajaService.anular(order.reciboId);
      } catch (e: any) {
        // skip if receipt not found or already annulled
      }
    }

    order.estado = 'cancelado';
    (order as any).annulledById = userId || null;
    (order as any).annulledAt = new Date();
    return this.orderRepo.save(order);
  }

  async getPendingByRoom() {
    const orders = await this.orderRepo.find({
      where: [
        { estado: 'borrador' },
        { estado: 'pendiente' },
      ],
      relations: ['room', 'guest', 'items', 'items.inventoryItem'],
      order: { createdAt: 'DESC' },
    });

    const grouped = new Map<string, { room: any; guest: any; total: number; orders: Order[] }>();
    for (const order of orders) {
      const key = order.roomId || '__no_room__';
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
