import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { ReciboCaja } from '../recibo-caja/entities/recibo-caja.entity';
import { ReciboCajaPago } from '../recibo-caja/entities/recibo-caja-pago.entity';
import { CashRegister } from '../cash-register/entities/cash-register.entity';
import { CreatePaymentDto, ChangeMetodoPagoDto, UpdatePaymentDto } from './dto/create-payment.dto';
import { FinancialMovementsService } from '../financial-movements/financial-movements.service';
import { FinancialAccountsService } from '../financial-accounts/financial-accounts.service';
import { PaymentMethodsService } from '../payment-methods/payment-methods.service';
import { JwtPayload } from '../auth/interfaces/auth.interface';
import { ROLES } from '../../common/constants';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
    @InjectRepository(ReciboCaja)
    private readonly reciboRepo: Repository<ReciboCaja>,
    @InjectRepository(ReciboCajaPago)
    private readonly reciboPagoRepo: Repository<ReciboCajaPago>,
    @InjectRepository(CashRegister)
    private readonly cashRegisterRepository: Repository<CashRegister>,
    private readonly financialMovementsService: FinancialMovementsService,
    private readonly financialAccountsService: FinancialAccountsService,
    private readonly paymentMethodsService: PaymentMethodsService,
  ) {}

  private applyCajaBucket(cashRegister: CashRegister, tipo: string, monto: number, sign: 1 | -1) {
    const delta = monto * sign;
    if (tipo === 'efectivo') cashRegister.totalEfectivo = Math.max(0, Number(cashRegister.totalEfectivo) + delta);
    else if (tipo === 'transferencia') cashRegister.totalTransferencia = Math.max(0, Number(cashRegister.totalTransferencia) + delta);
    else if (tipo === 'tarjeta') cashRegister.totalTarjeta = Math.max(0, Number(cashRegister.totalTarjeta) + delta);
    else cashRegister.totalOtros = Math.max(0, Number(cashRegister.totalOtros) + delta);
  }

  async findAll(filters?: { roomId?: string; metodoPagoId?: string }, page = 1, limit = 10) {
    const where: any = {};
    if (filters?.roomId) where.roomId = filters.roomId;
    if (filters?.metodoPagoId) where.metodoPagoId = filters.metodoPagoId;

    const [data, total] = await this.paymentRepo.findAndCount({
      where,
      relations: ['room', 'user', 'order', 'metodoPago'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByRoom(roomId: string) {
    return this.paymentRepo.find({
      where: { roomId },
      relations: ['order', 'user', 'metodoPago'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreatePaymentDto, userId: string) {
    const paymentMethod = await this.paymentMethodsService.findOne(dto.metodoPagoId);

    const payment = this.paymentRepo.create({
      ...dto,
      userId,
      fecha: new Date(),
    });

    const saved = await this.paymentRepo.save(payment);

    try {
      const accountId = paymentMethod.financialAccountId;
      if (accountId) {
        await this.financialMovementsService.create({
          accountId,
          tipo: 'INGRESO',
          monto: Number(dto.monto),
          concepto: `Pago - ${paymentMethod.nombre} - ${dto.observaciones || 'Sin referencia'}`,
          referenciaTipo: 'payment',
          referenciaId: saved.id,
        }, userId);
      }
    } catch (e) {
      // Silently skip if account not configured
    }

    if (dto.orderId) {
      const order = await this.orderRepo.findOne({
        where: { id: dto.orderId },
      });

      if (order) {
        const existingPayments = await this.paymentRepo.find({
          where: { orderId: dto.orderId },
        });
        const alreadyPaid = existingPayments.reduce((sum, p) => sum + Number(p.monto), 0);
        const paidTotal = alreadyPaid + Number(dto.monto);

        if (paidTotal >= Number(order.total)) {
          order.estado = 'pagado';
        }
        await this.orderRepo.save(order);
      }
    }

    return saved;
  }

  async changeMetodoPago(paymentId: string, dto: ChangeMetodoPagoDto, userId: string) {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: ['reservation', 'metodoPago'],
    });
    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    const newMethod = await this.paymentMethodsService.findOne(dto.metodoPagoId);
    if (payment.metodoPagoId === dto.metodoPagoId) {
      return this.paymentRepo.findOne({ where: { id: paymentId }, relations: ['metodoPago', 'metodoPago.financialAccount'] });
    }

    const estado = payment.reservation?.estado;
    if (!['confirmada', 'checkin'].includes(estado)) {
      throw new BadRequestException('Solo se puede cambiar el método de pago en reservas confirmadas o en check-in');
    }

    const oldAccountId = payment.metodoPago?.financialAccountId || null;
    const newAccountId = newMethod.financialAccountId || null;

    const reciboPagos = await this.reciboPagoRepo.find({
      where: { referenciaTipo: 'payment', referenciaId: payment.id },
    });

    const codigo = payment.reservation?.codigo || 'Pago';
    const oldNombre = payment.metodoPago?.nombre || 'anterior';
    const newNombre = newMethod.nombre;
    const monto = Number(payment.monto);

    const cashRegister = await this.cashRegisterRepository.findOne({ where: { estado: 'abierta' } });

    const oldTipo = payment.metodoPago?.tipo || 'otros';
    const newTipo = newMethod.tipo || 'otros';
    if (cashRegister && oldTipo !== newTipo) {
      this.applyCajaBucket(cashRegister, oldTipo, monto, -1);
      this.applyCajaBucket(cashRegister, newTipo, monto, 1);
      await this.cashRegisterRepository.save(cashRegister);
    }

    if (oldAccountId && newAccountId && oldAccountId !== newAccountId) {
      const concepto = `Cambio de método ${codigo}: ${oldNombre} → ${newNombre}`;
      await this.financialMovementsService.create({
        accountId: oldAccountId,
        tipo: 'TRANSFERENCIA_SALIDA',
        monto,
        concepto,
        referenciaTipo: 'payment',
        referenciaId: payment.id,
        reciboId: reciboPagos[0]?.reciboId,
        reservationId: payment.reservationId,
        cashRegisterId: cashRegister?.id,
      }, userId);

      await this.financialMovementsService.create({
        accountId: newAccountId,
        tipo: 'TRANSFERENCIA_ENTRADA',
        monto,
        concepto,
        referenciaTipo: 'payment',
        referenciaId: payment.id,
        reciboId: reciboPagos[0]?.reciboId,
        reservationId: payment.reservationId,
        cashRegisterId: cashRegister?.id,
      }, userId);
    }

    payment.metodoPagoId = dto.metodoPagoId;
    const saved = await this.paymentRepo.save(payment);

    if (reciboPagos.length > 0) {
      for (const rp of reciboPagos) {
        rp.metodoPagoId = dto.metodoPagoId;
        rp.cuentaId = newAccountId || '';
        await this.reciboPagoRepo.save(rp);
      }
    }

    return this.paymentRepo.findOne({
      where: { id: saved.id },
      relations: ['metodoPago', 'metodoPago.financialAccount'],
    });
  }

  async update(paymentId: string, dto: UpdatePaymentDto, user: JwtPayload) {
    if (user.role !== ROLES.ADMIN) {
      throw new ForbiddenException('Solo el administrador puede editar un pago');
    }

    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: ['reservation', 'metodoPago', 'metodoPago.financialAccount', 'order'],
    });
    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    const oldMonto = Number(payment.monto);
    const oldMetodoPagoId = payment.metodoPagoId;
    const oldReservationId = payment.reservationId;

    let newMetodoPagoId: string | null = dto.metodoPagoId === undefined ? oldMetodoPagoId : (dto.metodoPagoId || null);
    let newReservationId: string | null = dto.reservationId === undefined ? oldReservationId : (dto.reservationId || null);

    const newMonto = dto.monto !== undefined ? Number(dto.monto) : oldMonto;
    if (newMonto < 0) {
      throw new BadRequestException('El monto no puede ser negativo');
    }

    let newMethod = null;
    if (newMetodoPagoId) {
      newMethod = newMetodoPagoId !== oldMetodoPagoId
        ? await this.paymentMethodsService.findOne(newMetodoPagoId)
        : payment.metodoPago;
    }

    let newReservation = null;
    if (newReservationId && newReservationId !== oldReservationId) {
      newReservation = await this.reservationRepo.findOne({
        where: { id: newReservationId },
        relations: ['room'],
      });
      if (!newReservation) {
        throw new NotFoundException('Reserva no encontrada');
      }
    }

    const oldAccountId = payment.metodoPago?.financialAccountId || null;
    const newAccountId = newMethod?.financialAccountId || null;
    const oldTipo = payment.metodoPago?.tipo || 'otros';
    const newTipo = newMethod?.tipo || 'otros';

    const cashRegister = await this.cashRegisterRepository.findOne({ where: { estado: 'abierta' } });
    if (cashRegister) {
      if (oldTipo !== newTipo || oldMonto !== newMonto) {
        this.applyCajaBucket(cashRegister, oldTipo, oldMonto, -1);
        cashRegister.totalVentas = Math.max(0, Number(cashRegister.totalVentas) - oldMonto);
        this.applyCajaBucket(cashRegister, newTipo, newMonto, 1);
        cashRegister.totalVentas = Number(cashRegister.totalVentas) + newMonto;
        await this.cashRegisterRepository.save(cashRegister);
      }
    }

    const reciboPagos = await this.reciboPagoRepo.find({
      where: { referenciaTipo: 'payment', referenciaId: payment.id },
    });

    const codigo = payment.reservation?.codigo || 'Pago';
    const newNombre = newMethod?.nombre || 'Pago';
    await this.financialMovementsService.replaceIngresoByReferencia(
      'payment',
      payment.id,
      {
        accountId: newAccountId,
        monto: newMonto,
        reservationId: newReservationId,
        concepto: `${payment.observaciones?.split(' - ')[0] || 'Pago'} ${codigo} - ${newNombre}`,
        reciboId: reciboPagos[0]?.reciboId || null,
        cashRegisterId: cashRegister?.id || null,
      },
      user.sub,
    );

    if (reciboPagos.length > 0) {
      for (const rp of reciboPagos) {
        rp.monto = newMonto;
        rp.metodoPagoId = newMetodoPagoId as string;
        rp.cuentaId = newAccountId || '';
        await this.reciboPagoRepo.save(rp);
      }

      const recibo = await this.reciboRepo.findOne({ where: { id: reciboPagos[0].reciboId } });
      if (recibo) {
        const allPagos = await this.reciboPagoRepo.find({ where: { reciboId: recibo.id } });
        const subtotal = allPagos.reduce((s, p) => s + Number(p.monto), 0);
        recibo.subtotal = subtotal;
        recibo.total = Math.max(0, subtotal - Number(recibo.descuento || 0));
        if (newReservationId !== undefined) {
          recibo.reservationId = newReservationId as string;
        }
        await this.reciboRepo.save(recibo);
      }
    }

    payment.monto = newMonto;
    payment.metodoPagoId = newMetodoPagoId as string;
    if (newReservationId !== undefined) {
      payment.reservationId = newReservationId as string;
      payment.roomId = (newReservation?.roomId ?? null) as string;
    }
    if (dto.comprobante !== undefined) payment.comprobante = dto.comprobante;
    if (dto.observaciones !== undefined) payment.observaciones = dto.observaciones;

    const saved = await this.paymentRepo.save(payment);

    if (payment.orderId) {
      const order = await this.orderRepo.findOne({ where: { id: payment.orderId } });
      if (order) {
        const existingPayments = await this.paymentRepo.find({ where: { orderId: payment.orderId } });
        const paidTotal = existingPayments.reduce((sum, p) => sum + Number(p.monto), 0);
        order.estado = paidTotal >= Number(order.total) ? 'pagado' : 'pendiente';
        await this.orderRepo.save(order);
      }
    }

    return this.paymentRepo.findOne({
      where: { id: saved.id },
      relations: ['reservation', 'metodoPago', 'metodoPago.financialAccount'],
    });
  }

  async getTotalsByDateRange(fechaInicio: Date, fechaFin: Date) {
    const payments = await this.paymentRepo.find({
      where: {
        fecha: Between(fechaInicio, fechaFin),
      },
      relations: ['metodoPago'],
    });

    let total = 0;
    let efectivo = 0;
    let transferencia = 0;
    let tarjeta = 0;
    let otros = 0;
    let count = 0;

    for (const p of payments) {
      const monto = Number(p.monto);
      total += monto;
      count++;
      const metodo = p.metodoPago?.nombre?.toLowerCase() || '';
      if (metodo === 'efectivo') efectivo += monto;
      else if (metodo === 'transferencia' || metodo === 'nequi' || metodo === 'bancolombia') transferencia += monto;
      else if (metodo === 'tarjeta' || metodo === 'tarjeta débito' || metodo === 'tarjeta crédito') tarjeta += monto;
      else otros += monto;
    }

    return { total, efectivo, transferencia, tarjeta, otros, count };
  }
}
