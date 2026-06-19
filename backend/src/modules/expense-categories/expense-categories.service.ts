import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseCategory } from './entities/expense-category.entity';
import { CreateExpenseCategoryDto, UpdateExpenseCategoryDto } from './dto/create-expense-category.dto';

@Injectable()
export class ExpenseCategoriesService {
  constructor(
    @InjectRepository(ExpenseCategory)
    private readonly repo: Repository<ExpenseCategory>,
  ) {}

  async findAll(search?: string, page = 1, limit = 10) {
    const query = this.repo.createQueryBuilder('c')
      .orderBy('c.nombre', 'ASC');

    if (search) {
      query.where('c.nombre ILIKE :search', { search: `%${search}%` });
    }

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllActive() {
    return this.repo.find({ where: { activo: true }, order: { nombre: 'ASC' } });
  }

  async findOne(id: string): Promise<ExpenseCategory> {
    const cat = await this.repo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Categoría de egreso no encontrada');
    return cat;
  }

  async create(dto: CreateExpenseCategoryDto): Promise<ExpenseCategory> {
    const existing = await this.repo.findOne({ where: { nombre: dto.nombre } });
    if (existing) throw new ConflictException('Ya existe una categoría con ese nombre');
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateExpenseCategoryDto): Promise<ExpenseCategory> {
    const cat = await this.findOne(id);
    Object.assign(cat, dto);
    return this.repo.save(cat);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
