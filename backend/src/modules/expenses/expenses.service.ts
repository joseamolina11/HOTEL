import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly repo: Repository<Expense>,
  ) {}

  async findAll(filters?: { categoryId?: string; supplierId?: string; metodoPago?: string; desde?: string; hasta?: string; search?: string }, page = 1, limit = 10) {
    const query = this.repo.createQueryBuilder('e')
      .leftJoinAndSelect('e.supplier', 'supplier')
      .leftJoinAndSelect('e.category', 'category')
      .leftJoinAndSelect('e.purchaseOrder', 'purchaseOrder')
      .leftJoinAndSelect('e.comprobanteFile', 'comprobanteFile')
      .orderBy('e.fecha', 'DESC')
      .addOrderBy('e.createdAt', 'DESC');

    if (filters?.categoryId) query.andWhere('e.categoryId = :categoryId', { categoryId: filters.categoryId });
    if (filters?.supplierId) query.andWhere('e.supplierId = :supplierId', { supplierId: filters.supplierId });
    if (filters?.metodoPago) query.andWhere('e.metodoPago = :metodoPago', { metodoPago: filters.metodoPago });
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
      relations: ['supplier', 'category', 'purchaseOrder', 'comprobanteFile'],
    });
    if (!expense) throw new NotFoundException('Egreso no encontrado');
    return expense;
  }

  async findByCodigo(codigo: string): Promise<Expense> {
    const expense = await this.repo.findOne({
      where: { codigo },
      relations: ['supplier', 'category', 'purchaseOrder', 'comprobanteFile'],
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
    return this.repo.save(this.repo.create({ ...dto, codigo, createdBy: userId }));
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
