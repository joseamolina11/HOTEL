import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { Surcharge } from '../surcharges/entities/surcharge.entity';
import { CashRegister } from '../cash-register/entities/cash-register.entity';
import { CashRegisterService } from '../cash-register/cash-register.service';

export interface SurchargeReportFilters {
  desde?: string;
  hasta?: string;
  dispersado?: string;
  terceroId?: string;
}

export interface CashCloseReportFilters {
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
    private readonly cashRegisterService: CashRegisterService,
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

  async getCashCloseReport(filters: CashCloseReportFilters) {
    const qb = this.cashRegisterRepo
      .createQueryBuilder('cr')
      .leftJoinAndSelect('cr.user', 'user')
      .leftJoinAndSelect('cr.account', 'account')
      .where('cr.estado = :estado', { estado: 'cerrada' })
      .orderBy('cr.fechaCierre', 'DESC');

    if (filters.desde) {
      qb.andWhere('cr.fechaCierre >= :desde', { desde: new Date(`${filters.desde}T00:00:00`) });
    }
    if (filters.hasta) {
      qb.andWhere('cr.fechaCierre <= :hasta', { hasta: new Date(`${filters.hasta}T23:59:59`) });
    }

    const data = await qb.getMany();

    const totals = data.reduce(
      (acc, r) => {
        acc.efectivo += Number(r.totalEfectivo) || 0;
        acc.transferencia += Number(r.totalTransferencia) || 0;
        acc.tarjeta += Number(r.totalTarjeta) || 0;
        acc.otros += Number(r.totalOtros) || 0;
        acc.ventas += Number(r.totalVentas) || 0;
        return acc;
      },
      { efectivo: 0, transferencia: 0, tarjeta: 0, otros: 0, ventas: 0 },
    );

    return {
      data,
      totals,
      total: totals.efectivo + totals.transferencia + totals.tarjeta + totals.otros,
      count: data.length,
    };
  }

  async getCashCloseDetail(id: string) {
    const register = await this.cashRegisterService.findOne(id);
    const movementsRes = await this.cashRegisterService.findMovements(id, 1, 1000);
    const summary = await this.cashRegisterService.getSummary(id);

    return {
      register,
      summary: summary.summary,
      movements: movementsRes.movements.data,
    };
  }
}
