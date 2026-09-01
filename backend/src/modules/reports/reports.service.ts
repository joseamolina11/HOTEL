import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { Surcharge } from '../surcharges/entities/surcharge.entity';
import { CashRegister } from '../cash-register/entities/cash-register.entity';
import { FinancialMovement } from '../financial-movements/entities/financial-movement.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';
import { Room } from '../rooms/entities/room.entity';
import { Order } from '../orders/entities/order.entity';
import { Consumption } from '../consumptions/entities/consumption.entity';
import { CheckIn } from '../check-in/entities/check-in.entity';
import { Payment } from '../payments/entities/payment.entity';

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

export interface ExpensesReportFilters {
  desde?: string;
  hasta?: string;
}

export interface RoomReportFilters {
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
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepo: Repository<PaymentMethod>,
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Consumption)
    private readonly consumptionRepo: Repository<Consumption>,
    @InjectRepository(CheckIn)
    private readonly checkInRepo: Repository<CheckIn>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
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

    // Calculate totals from financial movements only
    // INGRESO adds to the payment method
    // TRANSFERENCIA_SALIDA subtracts from the source payment method
    // TRANSFERENCIA_ENTRADA adds to the destination payment method
    const totalsByMethod = {
      efectivo: 0,
      transferencia: 0,
      tarjeta: 0,
      otros: 0,
    };
    let totalGeneral = 0;
    let totalTransacciones = 0;

    // For each cash register, get its movements and calculate totals
    const registersWithMovements = await Promise.all(
      data.map(async (cr) => {
        const movements = await this.financialMovementRepo.find({
          where: { cashRegisterId: cr.id },
          relations: ['account'],
          order: { fechaMovimiento: 'ASC' },
        });

        const registerTotals = {
          efectivo: 0,
          transferencia: 0,
          tarjeta: 0,
          otros: 0,
        };
        let registerTotal = 0;
        let registerCount = 0;
        const ingresos: any[] = [];
        const transferencias: any[] = [];

        for (const m of movements) {
          if (m.tipo === 'INGRESO') {
            let method: 'efectivo' | 'transferencia' | 'tarjeta' | 'otros' = 'otros';
            if (m.accountId) {
              const pm = await this.paymentMethodRepo.findOne({
                where: { financialAccountId: m.accountId },
              });
              if (pm?.tipo) method = pm.tipo as 'efectivo' | 'transferencia' | 'tarjeta' | 'otros';
            }
            const monto = Number(m.monto) || 0;
            registerTotals[method] = (registerTotals[method] || 0) + monto;
            registerTotal += monto;
            registerCount++;
            ingresos.push({ ...m, resolvedMethod: method });
          } else if (m.tipo === 'TRANSFERENCIA_SALIDA') {
            let method: 'efectivo' | 'transferencia' | 'tarjeta' | 'otros' = 'otros';
            if (m.accountId) {
              const pm = await this.paymentMethodRepo.findOne({
                where: { financialAccountId: m.accountId },
              });
              if (pm?.tipo) method = pm.tipo as 'efectivo' | 'transferencia' | 'tarjeta' | 'otros';
            }
            const monto = Number(m.monto) || 0;
            // Subtract from the source account
            registerTotals[method] = (registerTotals[method] || 0) - monto;
            registerTotal -= monto;
            transferencias.push({ ...m, resolvedMethod: method, type: 'salida' });
          } else if (m.tipo === 'TRANSFERENCIA_ENTRADA') {
            let method: 'efectivo' | 'transferencia' | 'tarjeta' | 'otros' = 'otros';
            if (m.accountId) {
              const pm = await this.paymentMethodRepo.findOne({
                where: { financialAccountId: m.accountId },
              });
              if (pm?.tipo) method = pm.tipo as 'efectivo' | 'transferencia' | 'tarjeta' | 'otros';
            }
            const monto = Number(m.monto) || 0;
            // Add to the destination account
            registerTotals[method] = (registerTotals[method] || 0) + monto;
            registerTotal += monto;
            transferencias.push({ ...m, resolvedMethod: method, type: 'entrada' });
          }
        }

        return {
          ...cr,
          movements,
          ingresos,
          transferencias,
          totals: registerTotals,
          totalGeneral: registerTotal,
          totalTransacciones: registerCount,
        };
      })
    );

    // Sum up totals across all registers
    for (const cr of registersWithMovements) {
      totalsByMethod.efectivo += cr.totals.efectivo || 0;
      totalsByMethod.transferencia += cr.totals.transferencia || 0;
      totalsByMethod.tarjeta += cr.totals.tarjeta || 0;
      totalsByMethod.otros += cr.totals.otros || 0;
      totalGeneral += cr.totalGeneral || 0;
      totalTransacciones += cr.totalTransacciones || 0;
    }

    return {
      data: registersWithMovements,
      totals: {
        ...totalsByMethod,
        totalGeneral,
        totalTransacciones,
      },
      count: data.length,
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

  async getRoomReport(filters: RoomReportFilters) {
    // Get all rooms
    const rooms = await this.roomRepo.find({
      order: { numero: 'ASC' },
    });

    // Get orders by room
    const orderQb = this.orderRepo.createQueryBuilder('o')
      .leftJoinAndSelect('o.room', 'room')
      .where('o.estado != :cancelado', { cancelado: 'cancelado' });

    if (filters.desde) {
      const desde = new Date(`${filters.desde}T00:00:00`);
      orderQb.andWhere('o.fecha >= :desde', { desde });
    }
    if (filters.hasta) {
      const hasta = new Date(`${filters.hasta}T23:59:59`);
      orderQb.andWhere('o.fecha <= :hasta', { hasta });
    }

    const orders = await orderQb.getMany();

    // Get surcharges by room (through reservation)
    const surchargeQb = this.surchargeRepo.createQueryBuilder('s')
      .leftJoinAndSelect('s.reservation', 'reservation')
      .leftJoinAndSelect('reservation.room', 'room')
      .where('s.deleted_at IS NULL');

    if (filters.desde) {
      const desde = new Date(`${filters.desde}T00:00:00`);
      surchargeQb.andWhere('s.fecha >= :desde', { desde });
    }
    if (filters.hasta) {
      const hasta = new Date(`${filters.hasta}T23:59:59`);
      surchargeQb.andWhere('s.fecha <= :hasta', { hasta });
    }

    const surcharges = await surchargeQb.getMany();

    // Get consumptions (services) by room (through reservation)
    const consumptionQb = this.consumptionRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.reservation', 'reservation')
      .leftJoinAndSelect('reservation.room', 'room')
      .leftJoinAndSelect('c.inventoryItem', 'inventoryItem');

    if (filters.desde) {
      const desde = new Date(`${filters.desde}T00:00:00`);
      consumptionQb.andWhere('c.fecha >= :desde', { desde });
    }
    if (filters.hasta) {
      const hasta = new Date(`${filters.hasta}T23:59:59`);
      consumptionQb.andWhere('c.fecha <= :hasta', { hasta });
    }

    const consumptions = await consumptionQb.getMany();

    // Get check-ins by room (through reservation) - use reservation's precioBase
    const checkInQb = this.checkInRepo.createQueryBuilder('ci')
      .leftJoinAndSelect('ci.reservation', 'reservation')
      .leftJoinAndSelect('reservation.room', 'room');

    if (filters.desde) {
      const desde = new Date(`${filters.desde}T00:00:00`);
      checkInQb.andWhere('ci.fechaHora >= :desde', { desde });
    }
    if (filters.hasta) {
      const hasta = new Date(`${filters.hasta}T23:59:59`);
      checkInQb.andWhere('ci.fechaHora <= :hasta', { hasta });
    }

    const checkIns = await checkInQb.getMany();

    // Get payments by room
    const paymentQb = this.paymentRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.room', 'room')
      .leftJoinAndSelect('p.reservation', 'reservation');

    if (filters.desde) {
      const desde = new Date(`${filters.desde}T00:00:00`);
      paymentQb.andWhere('p.fecha >= :desde', { desde });
    }
    if (filters.hasta) {
      const hasta = new Date(`${filters.hasta}T23:59:59`);
      paymentQb.andWhere('p.fecha <= :hasta', { hasta });
    }

    const payments = await paymentQb.getMany();

    // Aggregate by room
    const roomData: Record<string, {
      room: Room;
      servicios: number;
      recargos: number;
      pedidos: number;
      checkins: number;
      pagos: number;
      total: number;
      serviciosCount: number;
      recargosCount: number;
      pedidosCount: number;
      checkinsCount: number;
      pagosCount: number;
    }> = {};

    // Initialize all rooms
    for (const room of rooms) {
      roomData[room.id] = {
        room,
        servicios: 0,
        recargos: 0,
        pedidos: 0,
        checkins: 0,
        pagos: 0,
        total: 0,
        serviciosCount: 0,
        recargosCount: 0,
        pedidosCount: 0,
        checkinsCount: 0,
        pagosCount: 0,
      };
    }

    // Aggregate orders (pedidos)
    for (const order of orders) {
      if (order.roomId && roomData[order.roomId]) {
        roomData[order.roomId].pedidos += Number(order.total) || 0;
        roomData[order.roomId].pedidosCount += 1;
      }
    }

    // Aggregate surcharges (recargos)
    for (const surcharge of surcharges) {
      const roomId = surcharge.reservation?.room?.id;
      if (roomId && roomData[roomId]) {
        roomData[roomId].recargos += Number(surcharge.subtotal) || 0;
        roomData[roomId].recargosCount += 1;
      }
    }

    // Aggregate consumptions (servicios)
    for (const consumption of consumptions) {
      const roomId = consumption.reservation?.room?.id;
      if (roomId && roomData[roomId]) {
        roomData[roomId].servicios += Number(consumption.subtotal) || 0;
        roomData[roomId].serviciosCount += 1;
      }
    }

    // Aggregate check-ins (use reservation precioBase)
    for (const checkIn of checkIns) {
      const roomId = checkIn.reservation?.room?.id;
      if (roomId && roomData[roomId]) {
        const precioBase = Number(checkIn.reservation?.precioBase) || 0;
        roomData[roomId].checkins += precioBase;
        roomData[roomId].checkinsCount += 1;
      }
    }

    // Aggregate payments
    for (const payment of payments) {
      const roomId = payment.roomId || payment.reservation?.room?.id;
      if (roomId && roomData[roomId]) {
        roomData[roomId].pagos += Number(payment.monto) || 0;
        roomData[roomId].pagosCount += 1;
      }
    }

    // Calculate totals
    for (const roomId of Object.keys(roomData)) {
      roomData[roomId].total = 
        roomData[roomId].servicios + 
        roomData[roomId].recargos + 
        roomData[roomId].pedidos +
        roomData[roomId].checkins +
        roomData[roomId].pagos;
    }

    // Convert to array and sort by room number
    const data = Object.values(roomData).sort((a, b) => 
      a.room.numero.localeCompare(b.room.numero, undefined, { numeric: true })
    );

    // Calculate grand totals
    const totales = {
      servicios: data.reduce((sum, r) => sum + r.servicios, 0),
      recargos: data.reduce((sum, r) => sum + r.recargos, 0),
      pedidos: data.reduce((sum, r) => sum + r.pedidos, 0),
      checkins: data.reduce((sum, r) => sum + r.checkins, 0),
      pagos: data.reduce((sum, r) => sum + r.pagos, 0),
      total: data.reduce((sum, r) => sum + r.total, 0),
      serviciosCount: data.reduce((sum, r) => sum + r.serviciosCount, 0),
      recargosCount: data.reduce((sum, r) => sum + r.recargosCount, 0),
      pedidosCount: data.reduce((sum, r) => sum + r.pedidosCount, 0),
      checkinsCount: data.reduce((sum, r) => sum + r.checkinsCount, 0),
      pagosCount: data.reduce((sum, r) => sum + r.pagosCount, 0),
    };

    return {
      data,
      totales,
      count: data.length,
    };
  }
}
