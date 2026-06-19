import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto, UpdateServiceDto } from './dto/create-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly repo: Repository<Service>,
  ) {}

  async findAll(search?: string, page = 1, limit = 10) {
    const query = this.repo.createQueryBuilder('s')
      .orderBy('s.nombre', 'ASC');

    if (search) {
      query.where('s.nombre ILIKE :search', { search: `%${search}%` });
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

  async findOne(id: string): Promise<Service> {
    const service = await this.repo.findOne({ where: { id } });
    if (!service) throw new NotFoundException('Servicio no encontrado');
    return service;
  }

  async create(dto: CreateServiceDto): Promise<Service> {
    const existing = await this.repo.findOne({ where: { nombre: dto.nombre } });
    if (existing) throw new ConflictException('Ya existe un servicio con ese nombre');
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    const service = await this.findOne(id);
    Object.assign(service, dto);
    return this.repo.save(service);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
