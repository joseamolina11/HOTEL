import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tercero } from './entities/tercero.entity';
import { CreateTerceroDto, UpdateTerceroDto, TerceroFilterDto } from './dto/tercero.dto';

@Injectable()
export class TercerosService {
  constructor(
    @InjectRepository(Tercero)
    private readonly terceroRepo: Repository<Tercero>,
  ) {}

  async findAll(filters: TerceroFilterDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.terceroRepo.createQueryBuilder('t').orderBy('t.nombre', 'ASC');

    if (filters.search) {
      qb.andWhere(
        '(t.nombre LIKE :search OR t.documento LIKE :search OR t.contacto LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }
    if (filters.tipo) {
      qb.andWhere('t.tipo = :tipo', { tipo: filters.tipo });
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllActive(): Promise<Tercero[]> {
    return this.terceroRepo.find({ where: { activo: true }, order: { nombre: 'ASC' } });
  }

  async findOne(id: string): Promise<Tercero> {
    const t = await this.terceroRepo.findOne({ where: { id } });
    if (!t) throw new NotFoundException('Tercero no encontrado');
    return t;
  }

  async create(dto: CreateTerceroDto): Promise<Tercero> {
    const tercero = this.terceroRepo.create(dto);
    return this.terceroRepo.save(tercero);
  }

  async update(id: string, dto: UpdateTerceroDto): Promise<Tercero> {
    const t = await this.findOne(id);
    Object.assign(t, dto);
    return this.terceroRepo.save(t);
  }

  async remove(id: string): Promise<void> {
    const t = await this.findOne(id);
    await this.terceroRepo.remove(t);
  }
}
