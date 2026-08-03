import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashRegister } from './entities/cash-register.entity';
import { OpenCashRegisterDto, CloseCashRegisterDto } from './dto/create-cash-register.dto';
import { FinancialMovementsService } from '../financial-movements/financial-movements.service';
import { FinancialAccountsService } from '../financial-accounts/financial-accounts.service';
import { FinancialMovement } from '../financial-movements/entities/financial-movement.entity';
import { ReciboCajaPago } from '../recibo-caja/entities/recibo-caja-pago.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';

@Injectable()
export class CashRegisterService {
  constructor(
    @InjectRepository(CashRegister)
    private readonly repo: Repository<CashRegister>,
    @InjectRepository(FinancialMovement)
    private readonly movementRepo: Repository<FinancialMovement>,
    @InjectRepository(ReciboCajaPago)
    private readonly reciboPagoRepo: Repository<ReciboCajaPago>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepo: Repository<PaymentMethod>,
    private readonly financialMovementsService: FinancialMovementsService,
    private readonly financialAccountsService: FinancialAccountsService,
  ) {}

  async findAll(page = 1, limit = 10) {
    const [data, total] = await this.repo.findAndCount({
      relations: ['user', 'account'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOpen() {
    return this.repo.findOne({
      where: { estado: 'abierta' },
      relations: ['user', 'account'],
    });
  }

  async open(dto: OpenCashRegisterDto, userId: string) {
    const existing = await this.findOpen();
    if (existing) {
      throw new BadRequestException('Ya hay una caja abierta. Ciérrala antes de abrir una nueva.');
    }

    const register = this.repo.create({
      userId,
      fechaApertura: new Date(),
      montoInicial: dto.montoInicial,
      totalVentas: 0,
      totalEfectivo: 0,
      totalTransferencia: 0,
      totalTarjeta: 0,
      totalOtros: 0,
      cantidadTransacciones: 0,
      estado: 'abierta',
      observaciones: dto.observaciones,
    });

    // Link to caja_menor account (informational, no balance-affecting movement)
    try {
      const accounts = await this.financialAccountsService.findAllActive();
      const cajaMenor = accounts.find(a => a.tipo === 'caja_menor') || accounts[0];
      if (cajaMenor) {
        register.accountId = cajaMenor.id;
      }
    } catch (e) {
      // silently skip
    }

    return this.repo.save(register);
  }

  async close(id: string, dto: CloseCashRegisterDto, userId?: string) {
    const register = await this.repo.findOne({ where: { id } });
    if (!register) throw new NotFoundException('Caja no encontrada');
    if (register.estado === 'cerrada') throw new BadRequestException('La caja ya está cerrada');

    const totalDeclarado = dto.totalEfectivo + dto.totalTransferencia + dto.totalTarjeta + dto.totalOtros;
    const totalVentas = userId
      ? await this.sumIngresosByUser(id, userId)
      : Number(register.totalVentas);
    const diferencia = dto.diferencia ?? (totalDeclarado - totalVentas);

    Object.assign(register, {
      fechaCierre: new Date(),
      totalEfectivo: dto.totalEfectivo,
      totalTransferencia: dto.totalTransferencia,
      totalTarjeta: dto.totalTarjeta,
      totalOtros: dto.totalOtros,
      totalVentas,
      cantidadTransacciones: dto.cantidadTransacciones,
      diferencia,
      observaciones: dto.observaciones,
      estado: 'cerrada' as const,
    });

    return this.repo.save(register);
  }

  private async sumIngresosByUser(id: string, userId: string): Promise<number> {
    const movements = await this.movementRepo.find({
      where: { cashRegisterId: id, userId, tipo: 'INGRESO' },
    });
    return movements.reduce((s, m) => s + (Number(m.monto) || 0), 0);
  }

  async findOne(id: string) {
    const register = await this.repo.findOne({
      where: { id },
      relations: ['user', 'account'],
    });
    if (!register) throw new NotFoundException('Caja no encontrada');
    return register;
  }

  async findMovements(id: string, page = 1, limit = 20, userId?: string) {
    const register = await this.findOne(id);
    const movements = await this.financialMovementsService.findAll({ cashRegisterId: id, userId }, page, limit);
    return {
      register,
      movements,
    };
  }

  /**
   * Desglose del turno de caja por método de pago.
   * - efectivo: montoInicial + ingresos - egresos (caja física)
   * - transferencia / tarjeta / otros: ingresos - egresos de cada método
   * - transferencias entre cuentas: mostradas aparte (solo las que tocan la
   *   cuenta de caja afectan al efectivo en caja)
   */
  async getSummary(id: string, userId?: string) {
    const register = await this.findOne(id);
    const movements = await this.movementRepo.find({
      where: userId ? { cashRegisterId: id, userId } : { cashRegisterId: id },
      relations: ['account', 'user', 'reciboCaja'],
      order: { fechaMovimiento: 'ASC', createdAt: 'ASC' },
    });

    const methods: Record<'efectivo' | 'transferencia' | 'tarjeta' | 'otros', { ingresos: number; egresos: number; total: number }> = {
      efectivo: { ingresos: 0, egresos: 0, total: 0 },
      transferencia: { ingresos: 0, egresos: 0, total: 0 },
      tarjeta: { ingresos: 0, egresos: 0, total: 0 },
      otros: { ingresos: 0, egresos: 0, total: 0 },
    };

    let transferenciasEntradas = 0;
    let transferenciasSalidas = 0;
    let transferenciasCajaNeto = 0;
    let ajustes = 0;

    const reciboCache = new Map<string, ReciboCajaPago[]>();
    const paymentCache = new Map<string, Payment | Payment[]>();

    for (const m of movements) {
      const monto = Number(m.monto) || 0;

      if (m.tipo === 'INGRESO' || m.tipo === 'EGRESO') {
        const method = await this.resolveMethod(m, reciboCache, paymentCache);
        const bucket = methods[method] || methods.otros;
        if (m.tipo === 'INGRESO') bucket.ingresos += monto;
        else bucket.egresos += monto;
      } else if (m.tipo === 'TRANSFERENCIA_ENTRADA') {
        transferenciasEntradas += monto;
        if (register.accountId && m.accountId === register.accountId) transferenciasCajaNeto += monto;
      } else if (m.tipo === 'TRANSFERENCIA_SALIDA') {
        transferenciasSalidas += monto;
        if (register.accountId && m.accountId === register.accountId) transferenciasCajaNeto -= monto;
      } else if (m.tipo === 'AJUSTE') {
        ajustes += monto;
      }
    }

    for (const key of Object.keys(methods) as Array<keyof typeof methods>) {
      methods[key].total = methods[key].ingresos - methods[key].egresos;
    }

    const efectivoEnCaja = Number(register.montoInicial) + methods.efectivo.total + transferenciasCajaNeto;

    const ingresosMovimientos = movements.filter((m) => m.tipo === 'INGRESO');
    const totalVentas = userId
      ? ingresosMovimientos.reduce((s, m) => s + (Number(m.monto) || 0), 0)
      : Number(register.totalVentas);
    const cantidadTransacciones = userId
      ? ingresosMovimientos.length
      : Number(register.cantidadTransacciones);

    return {
      register,
      summary: {
        montoInicial: Number(register.montoInicial),
        methods,
        transferencias: {
          entradas: transferenciasEntradas,
          salidas: transferenciasSalidas,
          neto: transferenciasEntradas - transferenciasSalidas,
        },
        transferenciasCajaNeto,
        ajustes,
        efectivoEnCaja,
        totalVentas,
        cantidadTransacciones,
        movementsCount: movements.length,
      },
    };
  }

  private async resolveMethod(
    movement: FinancialMovement,
    reciboCache: Map<string, ReciboCajaPago[]>,
    paymentCache: Map<string, Payment | Payment[]>,
  ): Promise<'efectivo' | 'transferencia' | 'tarjeta' | 'otros'> {
    // La cuenta financiera del movimiento identifica el método de pago usado
    if (movement.accountId) {
      const pm = await this.paymentMethodRepo.findOne({
        where: { financialAccountId: movement.accountId },
      });
      if (pm?.tipo) return pm.tipo;
    }

    if (movement.referenciaTipo === 'payment' && movement.referenciaId) {
      const key = `payment:${movement.referenciaId}`;
      let payment = paymentCache.get(key) as Payment | null | undefined;
      if (!payment) {
        payment = await this.paymentRepo.findOne({
          where: { id: movement.referenciaId },
          relations: ['metodoPago'],
        });
        if (payment) paymentCache.set(key, payment);
      }
      if (payment?.metodoPago?.tipo) return payment.metodoPago.tipo;
    }

    if (movement.reciboId) {
      let pagos = reciboCache.get(movement.reciboId);
      if (!pagos) {
        pagos = await this.reciboPagoRepo.find({
          where: { reciboId: movement.reciboId },
          relations: ['metodoPago'],
        });
        reciboCache.set(movement.reciboId, pagos);
      }
      if (pagos.length === 1) return pagos[0].metodoPago?.tipo || 'otros';
      if (movement.referenciaId) {
        const match = pagos.find((p) => p.referenciaId === movement.referenciaId);
        if (match?.metodoPago?.tipo) return match.metodoPago.tipo;
      }
      if (pagos.length > 1 && movement.referenciaId) {
        const match = pagos.find((p) => Number(p.monto) === Number(movement.monto));
        if (match?.metodoPago?.tipo) return match.metodoPago.tipo;
      }
    }

    if (movement.referenciaTipo === 'expense' && movement.referenciaId) {
      const expense = await this.expenseRepo.findOne({
        where: { id: movement.referenciaId },
        relations: ['metodoPago'],
      });
      if (expense?.metodoPago?.tipo) return expense.metodoPago.tipo;
    }

    if (movement.referenciaId) {
      const key = `order:${movement.referenciaId}`;
      let payments = paymentCache.get(key) as Payment[] | undefined;
      if (!payments) {
        payments = await this.paymentRepo.find({
          where: { orderId: movement.referenciaId },
          relations: ['metodoPago'],
        });
        paymentCache.set(key, payments);
      }
      if (payments.length === 1) return payments[0].metodoPago?.tipo || 'otros';
      if (payments.length > 1) {
        const match = payments.find((p) => Number(p.monto) === Number(movement.monto));
        if (match?.metodoPago?.tipo) return match.metodoPago.tipo;
      }
    }

    return movement.account?.tipo === 'caja_menor' ? 'efectivo' : 'transferencia';
  }
}
