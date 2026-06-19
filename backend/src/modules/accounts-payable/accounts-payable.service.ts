import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { AccountsPayable } from './entities/accounts-payable.entity';
import { PagoCuenta } from './entities/pago-cuenta.entity';
import { CreateAccountsPayableDto, UpdateAccountsPayableDto, RegisterPagoDto } from './dto/create-accounts-payable.dto';

@Injectable()
export class AccountsPayableService {
  constructor(
    @InjectRepository(AccountsPayable)
    private readonly repo: Repository<AccountsPayable>,
    @InjectRepository(PagoCuenta)
    private readonly pagoRepo: Repository<PagoCuenta>,
  ) {}

  async findAll(filters?: {
    search?: string;
    estado?: string;
    supplierId?: string;
    desde?: string;
    hasta?: string;
  }, page = 1, limit = 10) {
    const query = this.repo.createQueryBuilder('ap')
      .leftJoinAndSelect('ap.supplier', 'supplier')
      .leftJoinAndSelect('ap.purchaseOrder', 'purchaseOrder')
      .leftJoinAndSelect('ap.expense', 'expense')
      .orderBy('ap.createdAt', 'DESC');

    if (filters?.search) {
      query.andWhere('(ap.codigo ILIKE :search)', { search: `%${filters.search}%` });
    }
    if (filters?.estado) query.andWhere('ap.estado = :estado', { estado: filters.estado });
    if (filters?.supplierId) query.andWhere('ap.supplierId = :supplierId', { supplierId: filters.supplierId });
    if (filters?.desde) query.andWhere('ap.fechaEmision >= :desde', { desde: filters.desde });
    if (filters?.hasta) query.andWhere('ap.fechaEmision <= :hasta', { hasta: filters.hasta });

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<AccountsPayable> {
    const ap = await this.repo.findOne({
      where: { id },
      relations: ['supplier', 'purchaseOrder', 'expense', 'pagos'],
    });
    if (!ap) throw new NotFoundException('Cuenta por pagar no encontrada');
    return ap;
  }

  async findByCodigo(codigo: string): Promise<AccountsPayable> {
    const ap = await this.repo.findOne({
      where: { codigo },
      relations: ['supplier', 'purchaseOrder', 'expense', 'pagos'],
    });
    if (!ap) throw new NotFoundException('Cuenta por pagar no encontrada');
    return ap;
  }

  private async generateCodigo(): Promise<string> {
    const now = new Date();
    const prefix = `CP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-`;
    const last = await this.repo.findOne({
      where: { codigo: Like(`${prefix}%`) },
      order: { codigo: 'DESC' },
    });
    const lastNum = last ? parseInt(last.codigo.split('-').pop() || '0', 10) : 0;
    return `${prefix}${String(lastNum + 1).padStart(4, '0')}`;
  }

  async create(dto: CreateAccountsPayableDto, userId: string): Promise<AccountsPayable> {
    const codigo = await this.generateCodigo();
    return this.repo.save(this.repo.create({
      ...dto,
      codigo,
      saldoPendiente: dto.montoOriginal,
      createdBy: userId,
    }));
  }

  async update(id: string, dto: UpdateAccountsPayableDto): Promise<AccountsPayable> {
    const ap = await this.findOne(id);
    if (ap.estado === 'pagada' || ap.estado === 'anulada') {
      throw new BadRequestException('No se puede modificar una cuenta pagada o anulada');
    }
    Object.assign(ap, dto);
    if (dto.montoOriginal !== undefined) {
      const totalPagado = ap.pagos?.reduce((sum, p) => sum + Number(p.monto), 0) || 0;
      ap.saldoPendiente = dto.montoOriginal - totalPagado;
    }
    return this.repo.save(ap);
  }

  async remove(id: string): Promise<void> {
    const ap = await this.findOne(id);
    if (ap.estado === 'pagada') {
      throw new BadRequestException('No se puede eliminar una cuenta pagada');
    }
    await this.pagoRepo.delete({ cuentaId: id });
    await this.repo.delete(id);
  }

  async registerPago(cuentaId: string, dto: RegisterPagoDto, userId: string): Promise<AccountsPayable> {
    const ap = await this.findOne(cuentaId);
    if (ap.estado === 'pagada' || ap.estado === 'anulada') {
      throw new BadRequestException('No se pueden registrar pagos en cuentas pagadas o anuladas');
    }

    if (dto.monto > Number(ap.saldoPendiente)) {
      throw new BadRequestException('El pago excede el saldo pendiente');
    }

    await this.pagoRepo.save(this.pagoRepo.create({
      cuentaId,
      monto: dto.monto,
      fechaPago: dto.fechaPago,
      metodoPago: dto.metodoPago,
      referencia: dto.referencia,
      userId,
    }));

    const totalPagado = (await this.pagoRepo.find({ where: { cuentaId } }))
      .reduce((sum, p) => sum + Number(p.monto), 0);

    const nuevoSaldo = Number(ap.montoOriginal) - totalPagado;
    ap.saldoPendiente = nuevoSaldo;
    ap.estado = nuevoSaldo <= 0 ? 'pagada' : 'parcialmente_pagada';

    return this.repo.save(ap);
  }

  async getPagos(cuentaId: string): Promise<PagoCuenta[]> {
    return this.pagoRepo.find({
      where: { cuentaId },
      order: { createdAt: 'DESC' },
    });
  }
}
