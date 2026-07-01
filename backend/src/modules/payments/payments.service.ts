import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { FinancialMovementsService } from '../financial-movements/financial-movements.service';
import { FinancialAccountsService } from '../financial-accounts/financial-accounts.service';
import { PaymentMethodsService } from '../payment-methods/payment-methods.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly financialMovementsService: FinancialMovementsService,
    private readonly financialAccountsService: FinancialAccountsService,
    private readonly paymentMethodsService: PaymentMethodsService,
  ) {}

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
