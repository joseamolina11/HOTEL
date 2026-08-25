import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { Surcharge } from '../surcharges/entities/surcharge.entity';
import { CashRegister } from '../cash-register/entities/cash-register.entity';
import { FinancialMovement } from '../financial-movements/entities/financial-movement.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';

export interface SurchargeReportFilters {
  desde?: string;
  hasta?: string;
  dispersado?: string;
  terceroId?: string;
}

export interface CashRegisterReportFilters {
  desde?: string;
  hasta?: string;
}

export interface SalesReportFilters {
  desde?: string;
  hasta?: string;
}

export interface ExpensesReportFilters {
  desde?: string;
  hasta?: string;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Surcharge)
    private readonly surchargeRepo: Repository<Surcharge>,
    @InjectRepository(CashRegister)
    private readonly cashRegisterRepo: Repository<CashRegister>,
    @InjectRepository(FinancialMovement)
    private readonly financialMovementRepo: Repository<FinancialMovement>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepo: Repository<PaymentMethod>,
  ) {}

  async getSurchargesReport(filters: SurchargeReportFilters) {
    const qb = this.surchargeRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.surchargeType', 'surchargeType')
      .leftJoinAndSelect('surchargeType.tercero', 'surchargeTypeTercero')
      .leftJoinAndSelect('s.tercero', 'tercero')
      .leftJoinAndSelect('s.reservation', 'reservation')
      .leftJoinAndSelect('reservation.room', 'room')
      .leftJoinAndSelect('reservation.guest', 'guest')
      .where('s.deleted_at IS NULL')
      .orderBy('s.fecha', 'ASC');

    if (filters.desde) {
      const desde = new Date(`${filters.desde}T00:00:00`);
      qb.andWhere('s.fecha >= :desde', { desde });
    }
    if (filters.hasta) {
      const hasta = new Date(`${filters.hasta}T23:59:59`);
      qb.andWhere('s.fecha <= :hasta', { hasta });
    }
    if (filters.dispersado === 'true') {
      qb.andWhere('s.dispersado = :dispersado', { dispersado: true });
    } else if (filters.dispersado === 'false') {
      qb.andWhere('s.dispersado = :dispersado', { dispersado: false });
    }
    if (filters.terceroId) {
      qb.andWhere('(s.tercero_id = :terceroId OR surchargeType.tercero_id = :terceroId)', {
        terceroId: filters.terceroId,
      });
    }

    const data = await qb.getMany();

    const total = data.reduce((sum, s) => sum + Number(s.subtotal), 0);
    const porDispersar = data
      .filter((s) => !s.dispersado)
      .reduce((sum, s) => sum + Number(s.subtotal), 0);

    return {
      data,
      total,
      porDispersar,
      count: data.length,
    };
  }

  async disperseSurcharges(ids: string[], disperse = true) {
    if (!ids || ids.length === 0) return { updated: 0 };
    const result = await this.surchargeRepo.update(
      { id: In(ids) },
      disperse
        ? { dispersado: true, dispersadoAt: new Date() }
        : { dispersado: false, dispersadoAt: undefined as any },
    );
    return { updated: result.affected ?? 0 };
  }

  async getCashRegisterReport(filters: CashRegisterReportFilters) {
    const qb = this.cashRegisterRepo.createQueryBuilder('cr')
      .leftJoinAndSelect('cr.user', 'user')
      .leftJoinAndSelect('cr.account', 'account')
      .where('cr.estado = :estado', { estado: 'cerrada' })
      .orderBy('cr.fechaCierre', 'DESC');

    if (filters.desde) {
      const desde = new Date(`${filters.desde}T00:00:00`);
      qb.andWhere('cr.fechaCierre >= :desde', { desde });
    }
    if (filters.hasta) {
      const hasta = new Date(`${filters.hasta}T23:59:59`);
      qb.andWhere('cr.fechaCierre <= :hasta', { hasta });
    }

    const data = await qb.getMany();

    // Calculate declared totals (what was written at closing)
    const declaredTotals = {
      efectivo: 0,
      transferencia: 0,
      tarjeta: 0,
      otros: 0,
    };
    let declaredTotalGeneral = 0;
    let declaredTotalTransacciones = 0;

    // Calculate real totals from financial movements
    const realTotals = {
      efectivo: 0,
      transferencia: 0,
      tarjeta: 0,
      otros: 0,
    };
    let realTotalGeneral = 0;
    let realTotalTransacciones = 0;

    // For each cash register, get its movements and calculate real totals
    const registersWithMovements = await Promise.all(
      data.map(async (cr) => {
        // Get financial movements for this cash register
        const movements = await this.financialMovementRepo.find({
          where: { cashRegisterId: cr.id },
          relations: ['account'],
        });

        // Calculate real totals from movements by payment method
        const registerRealTotals = {
          efectivo: 0,
          transferencia: 0,
          tarjeta: 0,
          otros: 0,
        };
        let registerRealTotal = 0;
        let registerRealCount = 0;

        for (const m of movements) {
          if (m.tipo === 'INGRESO' || m.tipo === 'EGRESO') {
            let method = 'otros';
            
            // Resolve payment method from account
            if (m.accountId) {
              const pm = await this.paymentMethodRepo.findOne({
                where: { financialAccountId: m.accountId },
              });
              if (pm?.tipo) method = pm.tipo;
            }

            const monto = Number(m.monto) || 0;
            // @ts-ignore
            registerRealTotals[method] = (registerRealTotals[method] || 0) + monto;
            registerRealTotal += monto;
            registerRealCount++;
          }
        }

        return {
          ...cr,
          realTotals: registerRealTotals,
          realTotalGeneral: registerRealTotal,
          realTotalTransacciones: registerRealCount,
          movementsCount: movements.length,
        };
      })
    );

    // Sum up declared totals
    for (const cr of data) {
      declaredTotals.efectivo += Number(cr.totalEfectivo || 0);
      declaredTotals.transferencia += Number(cr.totalTransferencia || 0);
      declaredTotals.tarjeta += Number(cr.totalTarjeta || 0);
      declaredTotals.otros += Number(cr.totalOtros || 0);
      declaredTotalGeneral += Number(cr.totalVentas || 0);
      declaredTotalTransacciones += Number(cr.cantidadTransacciones || 0);
    }

    // Sum up real totals
    for (const cr of registersWithMovements) {
      realTotals.efectivo += cr.realTotals.efectivo || 0;
      realTotals.transferencia += cr.realTotals.transferencia || 0;
      realTotals.tarjeta += cr.realTotals.tarjeta || 0;
      realTotals.otros += cr.realTotals.otros || 0;
      realTotalGeneral += cr.realTotalGeneral || 0;
      realTotalTransacciones += cr.realTotalTransacciones || 0;
    }

    return {
      data: registersWithMovements,
      declaredTotals: {
        ...declaredTotals,
        totalGeneral: declaredTotalGeneral,
        totalTransacciones: declaredTotalTransacciones,
      },
      realTotals: {
        ...realTotals,
        totalGeneral: realTotalGeneral,
        totalTransacciones: realTotalTransacciones,
      },
      count: data.length,
    };
  }

  async getSalesReport(filters: SalesReportFilters) {
    // Get all INGRESO movements (sales/ingressos)
    const qb = this.financialMovementRepo.createQueryBuilder('fm')
      .leftJoinAndSelect('fm.account', 'account')
      .leftJoinAndSelect('fm.user', 'user')
      .leftJoinAndSelect('fm.reservation', 'reservation')
      .leftJoinAndSelect('reservation.guest', 'guest')
      .leftJoinAndSelect('reservation.room', 'room')
      .where('fm.tipo = :tipo', { tipo: 'INGRESO' })
      .orderBy('fm.fechaMovimiento', 'DESC');

    if (filters.desde) {
      const desde = new Date(`${filters.desde}T00:00:00`);
      qb.andWhere('fm.fechaMovimiento >= :desde', { desde });
    }
    if (filters.hasta) {
      const hasta = new Date(`${filters.hasta}T23:59:59`);
      qb.andWhere('fm.fechaMovimiento <= :hasta', { hasta });
    }

    const movements = await qb.getMany();

    // Group by payment method
    const methodTotals: Record<string, { ingresos: number; count: number }> = {};
    
    for (const m of movements) {
      let method = 'otros';
      
      // Resolve payment method from account
      if (m.accountId) {
        const pm = await this.paymentMethodRepo.findOne({
          where: { financialAccountId: m.accountId },
        });
        if (pm?.tipo) method = pm.tipo;
      }
      
      // If not found via account, try via reference (payment)
      if (method === 'otros' && m.referenciaTipo === 'payment' && m.referenciaId) {
        const payment = await this.paymentRepo.findOne({
          where: { id: m.referenciaId },
          relations: ['metodoPago'],
        });
        if (payment?.metodoPago?.tipo) method = payment.metodoPago.tipo;
      }

      if (!methodTotals[method]) {
        methodTotals[method] = { ingresos: 0, count: 0 };
      }
      methodTotals[method].ingresos += Number(m.monto) || 0;
      methodTotals[method].count += 1;
    }

    // Also get payments directly for a more complete picture
    const paymentQb = this.paymentRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.metodoPago', 'metodoPago')
      .leftJoinAndSelect('p.user', 'user')
      .leftJoinAndSelect('p.reservation', 'reservation')
      .leftJoinAndSelect('reservation.guest', 'guest')
      .leftJoinAndSelect('reservation.room', 'room')
      .orderBy('p.fecha', 'DESC');

    if (filters.desde) {
      const desde = new Date(`${filters.desde}T00:00:00`);
      paymentQb.andWhere('p.fecha >= :desde', { desde });
    }
    if (filters.hasta) {
      const hasta = new Date(`${filters.hasta}T23:59:59`);
      paymentQb.andWhere('p.fecha <= :hasta', { hasta });
    }

    const payments = await paymentQb.getMany();

    // Add payments that don't have financial movements
    for (const p of payments) {
      const method = p.metodoPago?.tipo || 'otros';
      if (!methodTotals[method]) {
        methodTotals[method] = { ingresos: 0, count: 0 };
      }
      methodTotals[method].ingresos += Number(p.monto) || 0;
      methodTotals[method].count += 1;
    }

    const totalVentas = Object.values(methodTotals).reduce((sum, m) => sum + m.ingresos, 0);
    const totalCount = Object.values(methodTotals).reduce((sum, m) => sum + m.count, 0);

    return {
      movements,
      payments,
      methodTotals,
      totalVentas,
      totalCount,
    };
  }

  async getExpensesReport(filters: ExpensesReportFilters) {
    // Get all EGRESO movements (expenses/egresos) - exclude anulación/cancelaciones
    const qb = this.financialMovementRepo.createQueryBuilder('fm')
      .leftJoinAndSelect('fm.account', 'account')
      .leftJoinAndSelect('fm.user', 'user')
      .where('fm.tipo = :tipo', { tipo: 'EGRESO' })
      // Exclude movements related to anulación/cancelación
      .andWhere('fm.concepto NOT ILIKE :anulacion', { anulacion: '%anulacion%' })
      .andWhere('fm.concepto NOT ILIKE :anulada', { anulada: '%anulada%' })
      .andWhere('fm.concepto NOT ILIKE :anulado', { anulado: '%anulado%' })
      .andWhere('fm.concepto NOT ILIKE :cancelacion', { cancelacion: '%cancelacion%' })
      .andWhere('fm.concepto NOT ILIKE :cancelado', { cancelado: '%cancelado%' })
      .andWhere('fm.concepto NOT ILIKE :void', { void: '%void%' })
      .orderBy('fm.fechaMovimiento', 'DESC');

    if (filters.desde) {
      const desde = new Date(`${filters.desde}T00:00:00`);
      qb.andWhere('fm.fechaMovimiento >= :desde', { desde });
    }
    if (filters.hasta) {
      const hasta = new Date(`${filters.hasta}T23:59:59`);
      qb.andWhere('fm.fechaMovimiento <= :hasta', { hasta });
    }

    const movements = await qb.getMany();

    // Group by payment method
    const methodTotals: Record<string, { egresos: number; count: number }> = {};
    
    for (const m of movements) {
      let method = 'otros';
      
      // Resolve payment method from account
      if (m.accountId) {
        const pm = await this.paymentMethodRepo.findOne({
          where: { financialAccountId: m.accountId },
        });
        if (pm?.tipo) method = pm.tipo;
      }
      
      // If not found via account, try via reference (expense)
      if (method === 'otros' && m.referenciaTipo === 'expense' && m.referenciaId) {
        const expense = await this.expenseRepo.findOne({
          where: { id: m.referenciaId },
          relations: ['metodoPago', 'category'],
        });
        if (expense?.metodoPago?.tipo) method = expense.metodoPago.tipo;
      }

      if (!methodTotals[method]) {
        methodTotals[method] = { egresos: 0, count: 0 };
      }
      methodTotals[method].egresos += Number(m.monto) || 0;
      methodTotals[method].count += 1;
    }

    // Also get expenses directly for a more complete picture - exclude anulación
    const expenseQb = this.expenseRepo.createQueryBuilder('e')
      .leftJoinAndSelect('e.metodoPago', 'metodoPago')
      .leftJoinAndSelect('e.category', 'category')
      .leftJoinAndSelect('e.createdBy', 'createdBy')
      .leftJoinAndSelect('e.supplier', 'supplier')
      // Exclude anulación/cancelación
      .andWhere('e.concepto NOT ILIKE :anulacion', { anulacion: '%anulacion%' })
      .andWhere('e.concepto NOT ILIKE :anulada', { anulada: '%anulada%' })
      .andWhere('e.concepto NOT ILIKE :anulado', { anulado: '%anulado%' })
      .andWhere('e.concepto NOT ILIKE :cancelacion', { cancelacion: '%cancelacion%' })
      .andWhere('e.concepto NOT ILIKE :cancelado', { cancelado: '%cancelado%' })
      .andWhere('e.concepto NOT ILIKE :void', { void: '%void%' })
      .orderBy('e.fecha', 'DESC');

    if (filters.desde) {
      const desde = new Date(`${filters.desde}T00:00:00`);
      expenseQb.andWhere('e.fecha >= :desde', { desde });
    }
    if (filters.hasta) {
      const hasta = new Date(`${filters.hasta}T23:59:59`);
      expenseQb.andWhere('e.fecha <= :hasta', { hasta });
    }

    const expenses = await expenseQb.getMany();

    // Add expenses that don't have financial movements
    for (const e of expenses) {
      const method = e.metodoPago?.tipo || 'otros';
      if (!methodTotals[method]) {
        methodTotals[method] = { egresos: 0, count: 0 };
      }
      methodTotals[method].egresos += Number(e.monto) || 0;
      methodTotals[method].count += 1;
    }

    const totalEgresos = Object.values(methodTotals).reduce((sum, m) => sum + m.egresos, 0);
    const totalCount = Object.values(methodTotals).reduce((sum, m) => sum + m.count, 0);

    return {
      movements,
      expenses,
      methodTotals,
      totalEgresos,
      totalCount,
    };
  }
}
