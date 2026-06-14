import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryCategory } from './entities/inventory-category.entity';

@Injectable()
export class InventoryCategoryService {
  constructor(
    @InjectRepository(InventoryCategory)
    private readonly repo: Repository<InventoryCategory>,
  ) {}

  async findAll(page = 1, limit = 10) {
    const [data, total] = await this.repo.findAndCount({
      where: { activo: true },
      order: { nombre: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(nombre: string, descripcion?: string): Promise<InventoryCategory> {
    return this.repo.save(this.repo.create({ nombre, descripcion }));
  }

  async update(id: string, data: Partial<InventoryCategory>): Promise<InventoryCategory> {
    const cat = await this.repo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    Object.assign(cat, data);
    return this.repo.save(cat);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
