import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CheckOut } from './entities/check-out.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Consumption } from '../consumptions/entities/consumption.entity';
import { Room } from '../rooms/entities/room.entity';
import { Order } from '../orders/entities/order.entity';
import { Payment } from '../payments/entities/payment.entity';
import { CashRegister } from '../cash-register/entities/cash-register.entity';
import { HotelConfig } from '../hotel-config/entities/hotel-config.entity';
import { CheckOutDto } from './dto/check-out.dto';
import { PaymentMethodsService } from '../payment-methods/payment-methods.service';
import { ReciboCajaService } from '../recibo-caja/recibo-caja.service';
import { FinancialMovementsService } from '../financial-movements/financial-movements.service';

@Injectable()
export class CheckOutService {
  constructor(
    @InjectRepository(CheckOut)
    private readonly checkOutRepository: Repository<CheckOut>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(Consumption)
    private readonly consumptionRepository: Repository<Consumption>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(CashRegister)
    private readonly cashRegisterRepository: Repository<CashRegister>,
    @InjectRepository(HotelConfig)
    private readonly hotelConfigRepository: Repository<HotelConfig>,
    private readonly paymentMethodsService: PaymentMethodsService,
    private readonly reciboCajaService: ReciboCajaService,
    private readonly financialMovementsService: FinancialMovementsService,
  ) {}

  async findPendingCheckOuts() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const todayDepartures = await this.reservationRepository.find({
      where: {
        fechaSalida: Between(startOfDay, endOfDay),
        estado: 'checkin',
      },
      relations: ['room', 'room.roomType', 'guest', 'companions', 'contratoFile'],
      order: { fechaSalida: 'ASC' },
    });

    const allCheckedIn = await this.reservationRepository.find({
      where: { estado: 'checkin' },
      relations: ['room', 'room.roomType', 'guest', 'companions', 'contratoFile'],
      order: { fechaSalida: 'ASC' },
    });

    return { todayDepartures, allCheckedIn };
  }

  async getStaySummary(reservationId: string) {
    const reservation = await this.reservationRepository.findOne({
      where: { id: reservationId },
      relations: [
        'room', 'room.roomType',
        'guest', 'companions',
        'consumptions', 'consumptions.inventoryItem',
        'contratoFile',
      ],
    });

    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }

    const totalConsumos = reservation.consumptions?.reduce(
      (sum, c) => sum + Number(c.subtotal),
      0,
    ) || 0;

    const pendingOrders = await this.orderRepository.find({
      where: {
        reservationId,
        estado: 'pendiente',
      },
      relations: ['items', 'items.inventoryItem'],
    });

    const totalPedidos = pendingOrders.reduce(
      (sum, o) => sum + Number(o.total),
      0,
    );

    const payments = await this.paymentRepository.find({
      where: { reservationId },
      order: { createdAt: 'DESC' },
    });

    const totalPagado = payments.reduce(
      (sum, p) => sum + Number(p.monto),
      0,
    );

    const noches = Math.ceil(
      (new Date(reservation.fechaSalida).getTime() - new Date(reservation.fechaEntrada).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    const precioNoche = Number(reservation.room.roomType.precioBase);
    const totalHabitacion = noches * precioNoche;
    const totalEstancia = totalHabitacion + totalConsumos + totalPedidos;
    const saldoPendiente = totalEstancia - totalPagado;

    const hotelConfig = await this.hotelConfigRepository.findOne({ where: {} });

    return {
      reservation,
      hotelConfig: hotelConfig || null,
      summary: {
        noches,
        precioPorNoche: precioNoche,
        totalHabitacion,
        consumos: reservation.consumptions || [],
        totalConsumos,
        pedidos: pendingOrders,
        totalPedidos,
        payments,
        totalPagado,
        totalEstancia,
        saldoPendiente,
      },
    };
  }

  async checkOut(checkOutDto: CheckOutDto, userId: string): Promise<CheckOut | null> {
    const reservation = await this.reservationRepository.findOne({
      where: { id: checkOutDto.reservationId },
      relations: ['consumptions', 'consumptions.inventoryItem', 'guest', 'room', 'room.roomType'],
    });

    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (reservation.estado !== 'checkin') {
      throw new BadRequestException(
        `La reserva debe estar en estado checkin para hacer check-out (estado actual: ${reservation.estado})`,
      );
    }

    const existingCheckOut = await this.checkOutRepository.findOne({
      where: { reservationId: checkOutDto.reservationId },
    });
    if (existingCheckOut) {
      throw new ConflictException('Esta reserva ya tiene un check-out registrado');
    }

    const totalConsumos = reservation.consumptions?.reduce(
      (sum, c) => sum + Number(c.subtotal),
      0,
    ) || 0;

    const checkOut = this.checkOutRepository.create({
      reservationId: checkOutDto.reservationId,
      userId,
      fechaHora: new Date(),
      observaciones: checkOutDto.observaciones,
      consumosTotal: totalConsumos,
    });

    if (checkOutDto.payments?.length) {
      const cashRegister = await this.cashRegisterRepository.findOne({
        where: { estado: 'abierta' },
      });

      let totalPaymentAmount = 0;
      let efectivo = 0;
      let transferencia = 0;
      let tarjeta = 0;
      let otros = 0;
      const savedPayments: Payment[] = [];

      for (const split of checkOutDto.payments) {
        const pm = await this.paymentMethodsService.findOne(split.metodoPagoId);
        totalPaymentAmount += split.monto;
        const tipo = pm.tipo || 'otros';
        if (tipo === 'efectivo') efectivo += split.monto;
        else if (tipo === 'transferencia') transferencia += split.monto;
        else if (tipo === 'tarjeta') tarjeta += split.monto;
        else otros += split.monto;

        const payment = this.paymentRepository.create({
          roomId: reservation.roomId,
          reservationId: reservation.id,
          userId,
          monto: split.monto,
          metodoPagoId: split.metodoPagoId,
          comprobante: split.comprobante,
          observaciones: `Check-out ${reservation.codigo} - ${pm.nombre}`,
          fecha: new Date(),
        });
        savedPayments.push(await this.paymentRepository.save(payment));
      }

      // Load pending orders with items for the receipt
      const pendingOrders = await this.orderRepository.find({
        where: { reservationId: reservation.id, estado: 'pendiente' },
        relations: ['items', 'items.inventoryItem'],
      });

      // Build items for the receipt (room charge + consumptions + orders)
      const noches = Math.ceil(
        (new Date(reservation.fechaSalida).getTime() - new Date(reservation.fechaEntrada).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      const precioNoche = Number(reservation.room?.roomType?.precioBase || 0);
      const itemsData: any[] = [];
      if (precioNoche > 0) {
        itemsData.push({
          concepto: `${reservation.room?.nombre || 'Habitación'} x ${noches} noche${noches > 1 ? 's' : ''}`,
          cantidad: noches,
          precioUnitario: precioNoche,
          subtotal: noches * precioNoche,
          tipo: 'habitacion',
        });
      }
      for (const c of reservation.consumptions || []) {
        itemsData.push({
          concepto: c.inventoryItem?.nombre || 'Producto',
          cantidad: c.cantidad,
          precioUnitario: Number(c.precioUnitario),
          subtotal: Number(c.subtotal),
          tipo: 'consumo',
        });
      }
      for (const order of pendingOrders) {
        for (const item of order.items || []) {
          itemsData.push({
            concepto: `${item.inventoryItem?.nombre || 'Producto'} (Pedido ${order.codigo || ''})`,
            cantidad: item.cantidad,
            precioUnitario: Number(item.precioUnitario),
            subtotal: Number(item.subtotal),
            tipo: 'pedido',
          });
        }
      }

      // Create Recibo de Caja
      const pagosData = await Promise.all(savedPayments.map(async (p, i) => {
        const split = checkOutDto.payments![i];
        const pmethod = await this.paymentMethodsService.findOne(p.metodoPagoId);
        return {
          concepto: split.concepto || `Check-out ${reservation.codigo}`,
          monto: Number(p.monto),
          metodoPagoId: p.metodoPagoId,
          cuentaId: pmethod.financialAccountId || '',
          referenciaTipo: 'payment',
          referenciaId: p.id,
        };
      }));
      const recibo = await this.reciboCajaService.create({
        clienteNombre: reservation.guest?.nombres || 'Huésped',
        reservationId: reservation.id,
        fecha: new Date().toISOString().slice(0, 10),
        subtotal: totalPaymentAmount,
        descuento: 0,
        total: totalPaymentAmount,
        pagos: pagosData,
        items: itemsData,
      }, userId);

      // Create INGRESO movements for each payment linked to the receipt
      for (const pagoData of pagosData) {
        if (pagoData.cuentaId) {
          try {
            await this.financialMovementsService.create({
              accountId: pagoData.cuentaId,
              tipo: 'INGRESO',
              monto: pagoData.monto,
              concepto: `Check-out ${reservation.codigo} - ${pagoData.concepto}`,
              referenciaTipo: 'payment',
              referenciaId: pagoData.referenciaId,
              reciboId: recibo.id,
              cashRegisterId: cashRegister?.id,
            }, userId);
          } catch (e: any) {
            // skip
          }
        }
      }

      if (cashRegister) {
        cashRegister.totalVentas = Number(cashRegister.totalVentas) + totalPaymentAmount;
        cashRegister.totalEfectivo = Number(cashRegister.totalEfectivo) + efectivo;
        cashRegister.totalTransferencia = Number(cashRegister.totalTransferencia) + transferencia;
        cashRegister.totalTarjeta = Number(cashRegister.totalTarjeta) + tarjeta;
        cashRegister.totalOtros = Number(cashRegister.totalOtros) + otros;
        cashRegister.cantidadTransacciones += checkOutDto.payments.length;
        await this.cashRegisterRepository.save(cashRegister);
      }

      let pendingTotal = pendingOrders.reduce((sum, o) => sum + Number(o.total), 0);
      let remainingPayment = totalPaymentAmount;

      for (const order of pendingOrders) {
        if (remainingPayment <= 0) break;
        const toApply = Math.min(Number(order.total), pendingTotal > 0 ? (remainingPayment * Number(order.total)) / pendingTotal : 0);
        const existingPayments = await this.paymentRepository.find({ where: { orderId: order.id } });
        const alreadyPaid = existingPayments.reduce((s, p) => s + Number(p.monto), 0);

        if (alreadyPaid + toApply >= Number(order.total)) {
          order.estado = 'pagado';
          await this.orderRepository.save(order);
        }
        remainingPayment -= toApply;
      }
    }

    await this.checkOutRepository.save(checkOut);
    await this.reservationRepository.update(reservation.id, { estado: 'checkout' });
    await this.roomRepository.update(reservation.roomId, { estado: 'limpieza' });

    return this.checkOutRepository.findOne({
      where: { id: checkOut.id },
      relations: ['reservation', 'reservation.room', 'reservation.guest', 'user'],
    });
  }
}
