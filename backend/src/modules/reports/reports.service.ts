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

export interface CashRegisterByRoomReportFilters {
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

    // Get all payments in date range with their relations
    const paymentQb = this.paymentRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.room', 'room')
      .leftJoinAndSelect('p.reservation', 'reservation')
      .leftJoinAndSelect('p.order', 'order')
      .leftJoinAndSelect('reservation.room', 'reservationRoom')
      .leftJoinAndSelect('reservation.consumptions', 'consumptions')
      .leftJoinAndSelect('reservation.surcharges', 'surcharges')
      .leftJoinAndSelect('reservation.checkIn', 'checkIn');

    if (filters.desde) {
      const desde = new Date(`${filters.desde}T00:00:00`);
      paymentQb.andWhere('p.fecha >= :desde', { desde });
    }
    if (filters.hasta) {
      const hasta = new Date(`${filters.hasta}T23:59:59`);
      paymentQb.andWhere('p.fecha <= :hasta', { hasta });
    }

    const payments = await paymentQb.getMany();

    // Also get consumptions, surcharges, orders, check-ins for rooms without direct payments
    // (for informational purposes - what was consumed/charged even if not paid yet)
    const consumptionQb = this.consumptionRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.reservation', 'reservation')
      .leftJoinAndSelect('reservation.room', 'room');

    if (filters.desde) {
      const desde = new Date(`${filters.desde}T00:00:00`);
      consumptionQb.andWhere('c.fecha >= :desde', { desde });
    }
    if (filters.hasta) {
      const hasta = new Date(`${filters.hasta}T23:59:59`);
      consumptionQb.andWhere('c.fecha <= :hasta', { hasta });
    }
    const consumptions = await consumptionQb.getMany();

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

    // Build maps for quick lookup
    const consumptionsByRoom: Record<string, number> = {};
    const consumptionsCountByRoom: Record<string, number> = {};
    for (const c of consumptions) {
      const roomId = c.reservation?.room?.id;
      if (roomId) {
        consumptionsByRoom[roomId] = (consumptionsByRoom[roomId] || 0) + Number(c.subtotal) || 0;
        consumptionsCountByRoom[roomId] = (consumptionsCountByRoom[roomId] || 0) + 1;
      }
    }

    const surchargesByRoom: Record<string, number> = {};
    const surchargesCountByRoom: Record<string, number> = {};
    for (const s of surcharges) {
      const roomId = s.reservation?.room?.id;
      if (roomId) {
        surchargesByRoom[roomId] = (surchargesByRoom[roomId] || 0) + Number(s.subtotal) || 0;
        surchargesCountByRoom[roomId] = (surchargesCountByRoom[roomId] || 0) + 1;
      }
    }

    const checkInsByRoom: Record<string, number> = {};
    const checkInsCountByRoom: Record<string, number> = {};
    for (const ci of checkIns) {
      const roomId = ci.reservation?.room?.id;
      if (roomId) {
        const precioBase = Number(ci.reservation?.precioBase) || 0;
        checkInsByRoom[roomId] = (checkInsByRoom[roomId] || 0) + precioBase;
        checkInsCountByRoom[roomId] = (checkInsCountByRoom[roomId] || 0) + 1;
      }
    }

    const ordersByRoom: Record<string, number> = {};
    const ordersCountByRoom: Record<string, number> = {};
    for (const o of orders) {
      if (o.roomId) {
        ordersByRoom[o.roomId] = (ordersByRoom[o.roomId] || 0) + Number(o.total) || 0;
        ordersCountByRoom[o.roomId] = (ordersCountByRoom[o.roomId] || 0) + 1;
      }
    }

    // Now categorize PAYMENTS by what they paid for
    // Payment can have: orderId, reservationId, roomId
    const roomData: Record<string, {
      room: Room;
      // What was charged/consumed (for reference)
      serviciosCharged: number;
      recargosCharged: number;
      pedidosCharged: number;
      checkinsCharged: number;
      // What was actually PAID (categorized by payment)
      serviciosPagados: number;
      recargosPagados: number;
      pedidosPagados: number;
      checkinsPagados: number;
      totalPagado: number;
      // Counts
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
        serviciosCharged: consumptionsByRoom[room.id] || 0,
        recargosCharged: surchargesByRoom[room.id] || 0,
        pedidosCharged: ordersByRoom[room.id] || 0,
        checkinsCharged: checkInsByRoom[room.id] || 0,
        serviciosPagados: 0,
        recargosPagados: 0,
        pedidosPagados: 0,
        checkinsPagados: 0,
        totalPagado: 0,
        serviciosCount: consumptionsCountByRoom[room.id] || 0,
        recargosCount: surchargesCountByRoom[room.id] || 0,
        pedidosCount: ordersCountByRoom[room.id] || 0,
        checkinsCount: checkInsCountByRoom[room.id] || 0,
        pagosCount: 0,
      };
    }

    // Categorize each payment by what it paid for
    for (const payment of payments) {
      let roomId = payment.roomId;
      
      if (!roomId && payment.reservation?.room?.id) {
        roomId = payment.reservation.room.id;
      }
      if (!roomId && payment.order?.roomId) {
        roomId = payment.order.roomId;
      }
      if (!roomId && payment.reservationId) {
        // Try to get room from reservation using repository
        const res = await this.paymentRepo.manager.getRepository('reservations').findOne({
          where: { id: payment.reservationId },
          relations: ['room'],
        });
        roomId = res?.room?.id;
      }

      if (!roomId || !roomData[roomId]) continue;

      const monto = Number(payment.monto) || 0;
      roomData[roomId].totalPagado += monto;
      roomData[roomId].pagosCount += 1;

      // Categorize by what the payment references
      if (payment.orderId) {
        // Payment for an order (pedidos)
        roomData[roomId].pedidosPagados += monto;
      } else if (payment.reservationId) {
        // Payment for a reservation - could be services, surcharges, or room stay
        const res = payment.reservation;
        const hasConsumptions = (res.consumptions?.length || 0) > 0;
        const hasSurcharges = (res.surcharges?.length || 0) > 0;
        const hasCheckIn = !!res.checkIn;

        if (hasConsumptions && !hasSurcharges && !hasCheckIn) {
          // Only services
          roomData[roomId].serviciosPagados += monto;
        } else if (hasSurcharges && !hasConsumptions && !hasCheckIn) {
          // Only surcharges
          roomData[roomId].recargosPagados += monto;
        } else if (hasCheckIn && !hasConsumptions && !hasSurcharges) {
          // Only room stay
          roomData[roomId].checkinsPagados += monto;
        } else {
          // Mixed - distribute proportionally based on charged amounts
          const totalCharged = 
            (consumptionsByRoom[roomId] || 0) + 
            (surchargesByRoom[roomId] || 0) + 
            (checkInsByRoom[roomId] || 0);
          
          if (totalCharged > 0) {
            if (consumptionsByRoom[roomId]) {
              roomData[roomId].serviciosPagados += monto * (consumptionsByRoom[roomId] / totalCharged);
            }
            if (surchargesByRoom[roomId]) {
              roomData[roomId].recargosPagados += monto * (surchargesByRoom[roomId] / totalCharged);
            }
            if (checkInsByRoom[roomId]) {
              roomData[roomId].checkinsPagados += monto * (checkInsByRoom[roomId] / totalCharged);
            }
          } else {
            // Fallback: split equally among existing categories
            const categories = [
              consumptionsByRoom[roomId] ? 'servicios' : null,
              surchargesByRoom[roomId] ? 'recargos' : null,
              checkInsByRoom[roomId] ? 'checkins' : null,
            ].filter(Boolean);
            
            const perCategory = monto / categories.length;
            if (categories.includes('servicios')) roomData[roomId].serviciosPagados += perCategory;
            if (categories.includes('recargos')) roomData[roomId].recargosPagados += perCategory;
            if (categories.includes('checkins')) roomData[roomId].checkinsPagados += perCategory;
          }
        }
      } else if (roomId) {
        // Direct room payment - assume it's for room stay (checkin)
        roomData[roomId].checkinsPagados += monto;
      }
    }

    // Convert to array and sort by room number
    const data = Object.values(roomData).sort((a, b) => 
      a.room.numero.localeCompare(b.room.numero, undefined, { numeric: true })
    );

    // Calculate grand totals
    const totales = {
      // Charged amounts (for reference)
      serviciosCharged: data.reduce((sum, r) => sum + r.serviciosCharged, 0),
      recargosCharged: data.reduce((sum, r) => sum + r.recargosCharged, 0),
      pedidosCharged: data.reduce((sum, r) => sum + r.pedidosCharged, 0),
      checkinsCharged: data.reduce((sum, r) => sum + r.checkinsCharged, 0),
      // Actually paid amounts (the real totals)
      serviciosPagados: data.reduce((sum, r) => sum + r.serviciosPagados, 0),
      recargosPagados: data.reduce((sum, r) => sum + r.recargosPagados, 0),
      pedidosPagados: data.reduce((sum, r) => sum + r.pedidosPagados, 0),
      checkinsPagados: data.reduce((sum, r) => sum + r.checkinsPagados, 0),
      totalPagado: data.reduce((sum, r) => sum + r.totalPagado, 0),
      // Counts
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

  async getCashRegisterByRoomReport(filters: CashRegisterByRoomReportFilters) {
    // Get closed cash registers in date range
    const qb = this.cashRegisterRepo.createQueryBuilder('cr')
      .leftJoinAndSelect('cr.user', 'user')
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

    const cashRegisters = await qb.getMany();
    const cashRegisterIds = cashRegisters.map(cr => cr.id);

    if (cashRegisterIds.length === 0) {
      return {
        data: [],
        totales: {
          efectivo: 0,
          transferencia: 0,
          tarjeta: 0,
          otros: 0,
          totalGeneral: 0,
          totalTransacciones: 0,
        },
        count: 0,
      };
    }

    // Get all financial movements for these cash registers (INGRESO only - income)
    const movements = await this.financialMovementRepo.createQueryBuilder('fm')
      .leftJoinAndSelect('fm.account', 'account')
      .leftJoinAndSelect('fm.reservation', 'reservation')
      .leftJoinAndSelect('reservation.room', 'reservationRoom')
      .leftJoinAndSelect('reservation.guest', 'guest')
      // Also check for room via payment reference
      .leftJoinAndSelect('fm.payment', 'payment')
      .leftJoinAndSelect('payment.room', 'paymentRoom')
      // Also check for room via order reference
      .leftJoinAndSelect('fm.order', 'order')
      .leftJoinAndSelect('order.room', 'orderRoom')
      .where('fm.cashRegisterId IN (:...ids)', { ids: cashRegisterIds })
      .andWhere('fm.tipo = :tipo', { tipo: 'INGRESO' })
      .orderBy('fm.fechaMovimiento', 'ASC')
      .getMany();

    // Get all rooms for reference
    const rooms = await this.roomRepo.find({ order: { numero: 'ASC' } });

    // Group movements by room
    const roomData: Record<string, {
      room: Room;
      efectivo: number;
      transferencia: number;
      tarjeta: number;
      otros: number;
      total: number;
      count: number;
      movements: any[];
      [key: string]: any;
    }> = {};

    type RoomReportData = {
      room: Room;
      efectivo: number;
      transferencia: number;
      tarjeta: number;
      otros: number;
      total: number;
      count: number;
      movements: any[];
      [key: string]: any;
    };

    // Initialize all rooms
    for (const room of rooms) {
      roomData[room.id] = {
        room,
        efectivo: 0,
        transferencia: 0,
        tarjeta: 0,
        otros: 0,
        total: 0,
        count: 0,
        movements: [],
      };
    }

    // Also track unassigned movements (no room)
    let sinHabitacion: RoomReportData = {
      room: { id: 'sin-habitacion', numero: 'SIN HABITACIÓN', nombre: 'Sin habitación asignada', piso: 0, roomType: null } as any,
      efectivo: 0,
      transferencia: 0,
      tarjeta: 0,
      otros: 0,
      total: 0,
      count: 0,
      movements: [],
    };

    for (const m of movements) {
      let method = 'otros';
      
      // Resolve payment method from account
      if (m.accountId) {
        const pm = await this.paymentMethodRepo.findOne({
          where: { financialAccountId: m.accountId },
        });
        if (pm?.tipo) method = pm.tipo;
      }

      const monto = Number(m.monto) || 0;
      // Try to get room from multiple sources
      const roomId = m.reservation?.roomId

      const room = m.reservation?.room 

      const movementData = {
        fecha: m.fechaMovimiento,
        concepto: m.concepto,
        monto,
        metodo: method,
        huesped: m.reservation?.guest ? `${m.reservation.guest.nombres} ${m.reservation.guest.apellidos}` : '—',
        habitacion: room?.numero || 'Sin habitación',
        cashRegisterId: m.cashRegisterId,
      };

      if (roomId && roomData[roomId]) {
        roomData[roomId][method] = (roomData[roomId][method] || 0) + monto;
        roomData[roomId].total += monto;
        roomData[roomId].count += 1;
        roomData[roomId].movements.push(movementData);
      } else {
        sinHabitacion[method] = (sinHabitacion[method] || 0) + monto;
        sinHabitacion.total += monto;
        sinHabitacion.count += 1;
        sinHabitacion.movements.push(movementData);
      }
    }

    // Convert to array and sort by room number
    const data = Object.values(roomData)
      .filter(r => r.count > 0)
      .sort((a, b) => 
        a.room.numero.localeCompare(b.room.numero, undefined, { numeric: true })
      );

    // Add "Sin habitación" if there are unassigned movements
    if (sinHabitacion.count > 0) {
      data.push({
        ...sinHabitacion,
        room: { id: 'sin-habitacion', numero: 'SIN HABITACIÓN', nombre: 'Sin habitación asignada', piso: 0, roomType: null } as any,
      });
    }

    // Calculate grand totals
    const totales = {
      efectivo: data.reduce((sum, r) => sum + r.efectivo, 0),
      transferencia: data.reduce((sum, r) => sum + r.transferencia, 0),
      tarjeta: data.reduce((sum, r) => sum + r.tarjeta, 0),
      otros: data.reduce((sum, r) => sum + r.otros, 0),
      totalGeneral: data.reduce((sum, r) => sum + r.total, 0),
      totalTransacciones: data.reduce((sum, r) => sum + r.count, 0),
    };

    return {
      data,
      totales,
      count: data.length,
    };
  }
}
