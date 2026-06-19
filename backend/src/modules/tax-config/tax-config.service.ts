import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxConfig } from './entities/tax-config.entity';
import { CreateTaxConfigDto, UpdateTaxConfigDto } from './dto/create-tax-config.dto';

@Injectable()
export class TaxConfigService {
  constructor(
    @InjectRepository(TaxConfig)
    private readonly repo: Repository<TaxConfig>,
  ) {}

  async findAll(page = 1, limit = 10) {
    const [data, total] = await this.repo.findAndCount({
      order: { nombre: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllActive() {
    return this.repo.find({ where: { activo: true }, order: { nombre: 'ASC' } });
  }

  async findDefault() {
    return this.repo.findOne({ where: { activo: true, esDefecto: true } });
  }

  async findOne(id: string): Promise<TaxConfig> {
    const tax = await this.repo.findOne({ where: { id } });
    if (!tax) throw new NotFoundException('Configuración de impuesto no encontrada');
    return tax;
  }

  async create(dto: CreateTaxConfigDto): Promise<TaxConfig> {
    if (dto.esDefecto) {
      await this.repo.update({ esDefecto: true }, { esDefecto: false });
    }
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateTaxConfigDto): Promise<TaxConfig> {
    const tax = await this.findOne(id);
    if (dto.esDefecto) {
      await this.repo.update({ esDefecto: true }, { esDefecto: false });
    }
    Object.assign(tax, dto);
    return this.repo.save(tax);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
