import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { AccountsPayable } from './entities/accounts-payable.entity';
import { PagoCuenta } from './entities/pago-cuenta.entity';
import { CreateAccountsPayableDto, UpdateAccountsPayableDto, RegisterPagoDto } from './dto/create-accounts-payable.dto';
import { FinancialMovementsService } from '../financial-movements/financial-movements.service';
import { FinancialAccountsService } from '../financial-accounts/financial-accounts.service';
import { PaymentMethodsService } from '../payment-methods/payment-methods.service';

@Injectable()
export class AccountsPayableService {
  private readonly logger = new Logger(AccountsPayableService.name);
  constructor(
    @InjectRepository(AccountsPayable)
    private readonly repo: Repository<AccountsPayable>,
    @InjectRepository(PagoCuenta)
    private readonly pagosRepo: Repository<PagoCuenta>,
    private readonly financialMovementsService: FinancialMovementsService,
    private readonly financialAccountsService: FinancialAccountsService,
    private readonly paymentMethodsService: PaymentMethodsService,
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
      .leftJoinAndSelect('ap.sourceExpense', 'sourceExpense')
      .leftJoinAndSelect('ap.createdBy', 'createdBy')
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
      relations: ['supplier', 'purchaseOrder', 'sourceExpense', 'createdBy'],
    });
    if (!ap) throw new NotFoundException('Cuenta por pagar no encontrada');
    return ap;
  }

  async findOneWithPayingExpenses(id: string): Promise<AccountsPayable> {
    const ap = await this.repo.findOne({
      where: { id },
      relations: ['supplier', 'purchaseOrder', 'sourceExpense', 'payingExpenses', 'payingExpenses.metodoPago', 'pagos', 'pagos.metodoPago', 'createdBy'],
    });
    if (!ap) throw new NotFoundException('Cuenta por pagar no encontrada');
    return ap;
  }

  async findByCodigo(codigo: string): Promise<AccountsPayable> {
    const ap = await this.repo.findOne({
      where: { codigo },
      relations: ['supplier', 'purchaseOrder', 'sourceExpense', 'createdBy'],
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
      createdById: userId,
    }));
  }

  async update(id: string, dto: UpdateAccountsPayableDto): Promise<AccountsPayable> {
    const ap = await this.findOne(id);
    if (ap.estado === 'pagada' || ap.estado === 'anulada') {
      throw new BadRequestException('No se puede modificar una cuenta pagada o anulada');
    }

    const updateData: any = { ...dto };
    if (dto.montoOriginal !== undefined) {
      const pagos = await this.pagosRepo.find({ where: { cuentaId: id } });
      const totalPagado = pagos.reduce((sum, p) => sum + Number(p.monto), 0);
      updateData.saldoPendiente = Math.max(0, dto.montoOriginal - totalPagado);
    }

    await this.repo.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const ap = await this.findOne(id);
    if (ap.estado === 'pagada') {
      throw new BadRequestException('No se puede eliminar una cuenta pagada');
    }
    await this.pagosRepo.delete({ cuentaId: id });
    await this.repo.delete(id);
  }

  async registerPago(cuentaId: string, dto: RegisterPagoDto, userId: string, skipFinancialMovement = false): Promise<AccountsPayable> {
    const ap = await this.repo.findOne({
      where: { id: cuentaId },
      select: ['id', 'codigo', 'estado', 'montoOriginal', 'saldoPendiente'],
    });
    if (!ap) throw new NotFoundException('Cuenta por pagar no encontrada');
    if (ap.estado === 'pagada' || ap.estado === 'anulada') {
      throw new BadRequestException('No se pueden registrar pagos en cuentas pagadas o anuladas');
    }

    if (dto.monto > Number(ap.saldoPendiente)) {
      throw new BadRequestException('El pago excede el saldo pendiente');
    }

    const paymentMethod = await this.paymentMethodsService.findOne(dto.metodoPagoId);

    await this.pagosRepo.save(this.pagosRepo.create({
      cuentaId,
      monto: dto.monto,
      fechaPago: dto.fechaPago,
      metodoPagoId: dto.metodoPagoId,
      referencia: dto.referencia,
      userId,
    }));

    if (!skipFinancialMovement) {
      try {
        const accountId = paymentMethod.financialAccountId;
        if (accountId) {
          await this.financialMovementsService.create({
            accountId,
            tipo: 'EGRESO',
            monto: Number(dto.monto),
            concepto: `Pago cuenta por pagar ${ap.codigo} - ${paymentMethod.nombre}`,
            referenciaTipo: 'accounts_payable',
            referenciaId: cuentaId,
          }, userId);
        }
      } catch (e: any) {
        this.logger.warn(`No se pudo crear movimiento financiero en AP: ${e.message}`);
      }
    }

    const totalPagado = (await this.pagosRepo.find({ where: { cuentaId } }))
      .reduce((sum, p) => sum + Number(p.monto), 0);

    const nuevoSaldo = Math.max(0, Number(ap.montoOriginal) - totalPagado);

    await this.repo.update(cuentaId, {
      saldoPendiente: nuevoSaldo,
      estado: nuevoSaldo <= 0 ? 'pagada' : 'parcialmente_pagada',
    });

    return this.findOneWithPayingExpenses(cuentaId);
  }

  async getPagos(cuentaId: string): Promise<PagoCuenta[]> {
    return this.pagosRepo.find({
      where: { cuentaId },
      relations: ['metodoPago'],
      order: { createdAt: 'DESC' },
    });
  }

  async findBySupplier(supplierId: string): Promise<AccountsPayable[]> {
    return this.repo.find({
      where: [
        { supplierId, estado: 'pendiente' },
        { supplierId, estado: 'parcialmente_pagada' },
      ],
      relations: ['supplier', 'purchaseOrder', 'sourceExpense'],
      order: { createdAt: 'DESC' },
    });
  }
}
