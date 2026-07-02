import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/create-expense.dto';
import { FinancialMovementsService } from '../financial-movements/financial-movements.service';
import { FinancialAccountsService } from '../financial-accounts/financial-accounts.service';
import { AccountsPayableService } from '../accounts-payable/accounts-payable.service';
import { PaymentMethodsService } from '../payment-methods/payment-methods.service';
import { CashRegister } from '../cash-register/entities/cash-register.entity';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);
  constructor(
    @InjectRepository(Expense)
    private readonly repo: Repository<Expense>,
    @InjectRepository(CashRegister)
    private readonly cashRegisterRepo: Repository<CashRegister>,
    private readonly financialMovementsService: FinancialMovementsService,
    private readonly financialAccountsService: FinancialAccountsService,
    private readonly accountsPayableService: AccountsPayableService,
    private readonly paymentMethodsService: PaymentMethodsService,
  ) {}

  async findAll(filters?: { categoryId?: string; supplierId?: string; metodoPagoId?: string; desde?: string; hasta?: string; search?: string }, page = 1, limit = 10) {
    const query = this.repo.createQueryBuilder('e')
      .leftJoinAndSelect('e.supplier', 'supplier')
      .leftJoinAndSelect('e.category', 'category')
      .leftJoinAndSelect('e.purchaseOrder', 'purchaseOrder')
      .leftJoinAndSelect('e.comprobanteFile', 'comprobanteFile')
      .leftJoinAndSelect('e.accountsPayable', 'accountsPayable')
      .leftJoinAndSelect('e.metodoPago', 'metodoPago')
      .leftJoinAndSelect('e.createdBy', 'createdBy')
      .orderBy('e.fecha', 'DESC')
      .addOrderBy('e.createdAt', 'DESC');

    if (filters?.categoryId) query.andWhere('e.categoryId = :categoryId', { categoryId: filters.categoryId });
    if (filters?.supplierId) query.andWhere('e.supplierId = :supplierId', { supplierId: filters.supplierId });
    if (filters?.metodoPagoId) query.andWhere('e.metodoPagoId = :metodoPagoId', { metodoPagoId: filters.metodoPagoId });
    if (filters?.desde) query.andWhere('e.fecha >= :desde', { desde: filters.desde });
    if (filters?.hasta) query.andWhere('e.fecha <= :hasta', { hasta: filters.hasta });
    if (filters?.search) {
      query.andWhere('(e.codigo ILIKE :search OR e.concepto ILIKE :search)', { search: `%${filters.search}%` });
    }

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Expense> {
    const expense = await this.repo.findOne({
      where: { id },
      relations: ['supplier', 'category', 'purchaseOrder', 'comprobanteFile', 'accountsPayable', 'metodoPago', 'createdBy'],
    });
    if (!expense) throw new NotFoundException('Egreso no encontrado');
    return expense;
  }

  async findByCodigo(codigo: string): Promise<Expense> {
    const expense = await this.repo.findOne({
      where: { codigo },
      relations: ['supplier', 'category', 'purchaseOrder', 'comprobanteFile', 'accountsPayable', 'metodoPago', 'createdBy'],
    });
    if (!expense) throw new NotFoundException('Egreso no encontrado');
    return expense;
  }

  private async generateCodigo(): Promise<string> {
    const now = new Date();
    const prefix = `EG-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-`;
    const last = await this.repo.findOne({
      where: { codigo: Like(`${prefix}%`) },
      order: { codigo: 'DESC' },
    });
    const lastNum = last ? parseInt(last.codigo.split('-').pop() || '0', 10) : 0;
    return `${prefix}${String(lastNum + 1).padStart(4, '0')}`;
  }

  async create(dto: CreateExpenseDto, userId: string): Promise<Expense> {
    const codigo = await this.generateCodigo();
    const expense = await this.repo.save(this.repo.create({ ...dto, codigo, createdById: userId }));

    let cashRegisterId: string | undefined;
    try {
      const openReg = await this.cashRegisterRepo.findOne({ where: { estado: 'abierta' } });
      if (openReg) cashRegisterId = openReg.id;
    } catch {}

    try {
      const paymentMethod = await this.paymentMethodsService.findOne(dto.metodoPagoId);
      const accountId = paymentMethod.financialAccountId;
      if (accountId) {
        let conceptoMov = `Egreso ${codigo} - ${dto.concepto}`;
        if (dto.accountsPayableId) {
          try {
            const ap = await this.accountsPayableService.findOne(dto.accountsPayableId);
            conceptoMov += ` (${ap.codigo})`;
          } catch {}
        }
        await this.financialMovementsService.create({
          accountId,
          tipo: 'EGRESO',
          monto: Number(dto.monto),
          concepto: conceptoMov,
          referenciaTipo: 'expense',
          referenciaId: expense.id,
          cashRegisterId,
        }, userId);
      }
    } catch (e: any) {
      this.logger.warn(`No se pudo crear movimiento financiero: ${e.message}`);
    }

    if (dto.accountsPayableId) {
      try {
        const ap = await this.accountsPayableService.registerPago(dto.accountsPayableId, {
          monto: Number(dto.monto),
          fechaPago: dto.fecha,
          metodoPagoId: dto.metodoPagoId,
          referencia: `Egreso ${codigo}`,
        }, userId, true);
        this.logger.log(`Cuenta por pagar ${dto.accountsPayableId} actualizada a estado ${ap.estado}`);
      } catch (e: any) {
        this.logger.error(`Error al registrar pago en cuenta por pagar: ${e.message}`);
      }
    }

    return expense;
  }

  async update(id: string, dto: UpdateExpenseDto): Promise<Expense> {
    const expense = await this.findOne(id);
    Object.assign(expense, dto);
    return this.repo.save(expense);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }

  async getReport(filters?: { categoryId?: string; desde?: string; hasta?: string }) {
    const query = this.repo.createQueryBuilder('e')
      .leftJoinAndSelect('e.category', 'category')
      .leftJoinAndSelect('e.supplier', 'supplier')
      .leftJoinAndSelect('e.comprobanteFile', 'comprobanteFile');

    if (filters?.categoryId) query.andWhere('e.categoryId = :categoryId', { categoryId: filters.categoryId });
    if (filters?.desde) query.andWhere('e.fecha >= :desde', { desde: filters.desde });
    if (filters?.hasta) query.andWhere('e.fecha <= :hasta', { hasta: filters.hasta });

    const expenses = await query.orderBy('e.fecha', 'DESC').getMany();

    const total = expenses.reduce((sum, e) => sum + Number(e.monto), 0);
    const byCategory: Record<string, { count: number; total: number }> = {};

    for (const e of expenses) {
      const catName = e.category?.nombre || 'Sin categoría';
      if (!byCategory[catName]) byCategory[catName] = { count: 0, total: 0 };
      byCategory[catName].count++;
      byCategory[catName].total += Number(e.monto);
    }

    return { expenses, total, byCategory };
  }
}
