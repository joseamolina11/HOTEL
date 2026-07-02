import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { FinancialMovement } from './entities/financial-movement.entity';
import { FinancialAccountsService } from '../financial-accounts/financial-accounts.service';
import { CreateFinancialMovementDto, TransferDto } from './dto/create-financial-movement.dto';

@Injectable()
export class FinancialMovementsService {
  constructor(
    @InjectRepository(FinancialMovement)
    private readonly repo: Repository<FinancialMovement>,
    private readonly accountsService: FinancialAccountsService,
  ) {}

  async findAll(filters?: { accountId?: string; tipo?: string; desde?: string; hasta?: string; cashRegisterId?: string; userId?: string }, page = 1, limit = 10) {
    const query = this.repo.createQueryBuilder('m')
      .leftJoinAndSelect('m.account', 'account')
      .leftJoinAndSelect('m.user', 'user')
      .leftJoinAndSelect('m.reciboCaja', 'reciboCaja')
      .leftJoinAndSelect('reciboCaja.reservation', 'reciboReservation')
      .orderBy('m.fechaMovimiento', 'DESC')
      .addOrderBy('m.createdAt', 'DESC');

    if (filters?.accountId) query.andWhere('m.accountId = :accountId', { accountId: filters.accountId });
    if (filters?.tipo) query.andWhere('m.tipo = :tipo', { tipo: filters.tipo });
    if (filters?.desde) query.andWhere('m.fechaMovimiento >= :desde', { desde: new Date(filters.desde) });
    if (filters?.hasta) query.andWhere('m.fechaMovimiento <= :hasta', { hasta: new Date(filters.hasta) });
    if (filters?.cashRegisterId) query.andWhere('m.cashRegisterId = :cashRegisterId', { cashRegisterId: filters.cashRegisterId });
    if (filters?.userId) query.andWhere('m.userId = :userId', { userId: filters.userId });

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByAccount(accountId: string, page = 1, limit = 50) {
    const [data, total] = await this.repo.findAndCount({
      where: { accountId },
      relations: ['account', 'user'],
      order: { fechaMovimiento: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const movement = await this.repo.findOne({
      where: { id },
      relations: ['account', 'user'],
    });
    if (!movement) throw new NotFoundException('Movimiento no encontrado');
    return movement;
  }

  async create(dto: CreateFinancialMovementDto, userId?: string) {
    const account = await this.accountsService.findOne(dto.accountId);
    const monto = Math.abs(dto.monto);
    const isIngreso = ['INGRESO', 'TRANSFERENCIA_ENTRADA', 'APERTURA_CAJA'].includes(dto.tipo);
    const isEgreso = ['EGRESO', 'TRANSFERENCIA_SALIDA'].includes(dto.tipo);

    let saldoAnterior = Number(account.saldo);
    let saldoPosterior: number;

    if (isIngreso) {
      saldoPosterior = saldoAnterior + monto;
    } else if (isEgreso) {
      if (saldoAnterior < monto) {
        throw new BadRequestException(`Saldo insuficiente en ${account.nombre}. Disponible: ${saldoAnterior}, requerido: ${monto}`);
      }
      saldoPosterior = saldoAnterior - monto;
    } else {
      if (dto.tipo === 'AJUSTE') {
        saldoPosterior = monto;
      } else {
        saldoPosterior = saldoAnterior;
      }
    }

    await this.accountsService.updateBalance(dto.accountId, saldoPosterior - saldoAnterior);

    const movement = this.repo.create({
      accountId: dto.accountId,
      tipo: dto.tipo,
      monto,
      saldoAnterior,
      saldoPosterior,
      concepto: dto.concepto,
      referenciaTipo: dto.referenciaTipo,
      referenciaId: dto.referenciaId,
      reciboId: dto.reciboId,
      cashRegisterId: dto.cashRegisterId,
      userId: userId || null,
      fechaMovimiento: new Date(),
    });

    return this.repo.save(movement);
  }

  async transfer(dto: TransferDto, userId?: string) {
    if (dto.originAccountId === dto.destinationAccountId) {
      throw new BadRequestException('No se puede transferir a la misma cuenta');
    }
    const monto = Math.abs(dto.monto);

    await this.create({
      accountId: dto.originAccountId,
      tipo: 'TRANSFERENCIA_SALIDA',
      monto,
      concepto: dto.concepto || 'Transferencia',
      referenciaTipo: 'transfer',
      cashRegisterId: dto.cashRegisterId,
    }, userId);

    return this.create({
      accountId: dto.destinationAccountId,
      tipo: 'TRANSFERENCIA_ENTRADA',
      monto,
      concepto: dto.concepto || 'Transferencia',
      referenciaTipo: 'transfer',
      cashRegisterId: dto.cashRegisterId,
    }, userId);
  }

  async getBalanceHistory(accountId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.repo.find({
      where: {
        accountId,
        fechaMovimiento: Between(since, new Date()),
      },
      order: { fechaMovimiento: 'ASC' },
    });
  }
}
