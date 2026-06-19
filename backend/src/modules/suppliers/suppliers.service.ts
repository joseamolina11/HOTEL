import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/create-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly repo: Repository<Supplier>,
  ) {}

  async findAll(search?: string, page = 1, limit = 10) {
    const query = this.repo.createQueryBuilder('s')
      .leftJoinAndSelect('s.rutFile', 'rutFile')
      .orderBy('s.razonSocial', 'ASC');

    if (search) {
      query.where('s.razonSocial ILIKE :search OR s.nit ILIKE :search OR s.contacto ILIKE :search', { search: `%${search}%` });
    }

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllActive() {
    return this.repo.find({ where: { activo: true }, order: { razonSocial: 'ASC' } });
  }

  async findOne(id: string): Promise<Supplier> {
    const supplier = await this.repo.findOne({
      where: { id },
      relations: ['rutFile'],
    });
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    return supplier;
  }

  async create(dto: CreateSupplierDto): Promise<Supplier> {
    const existing = await this.repo.findOne({ where: { nit: dto.nit } });
    if (existing) throw new ConflictException('Ya existe un proveedor con ese NIT');
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.findOne(id);
    if (dto.nit && dto.nit !== supplier.nit) {
      const existing = await this.repo.findOne({ where: { nit: dto.nit } });
      if (existing) throw new ConflictException('Ya existe un proveedor con ese NIT');
    }
    Object.assign(supplier, dto);
    return this.repo.save(supplier);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
