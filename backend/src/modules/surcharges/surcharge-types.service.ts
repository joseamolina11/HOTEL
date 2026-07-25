import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurchargeType } from './entities/surcharge-type.entity';
import { CreateSurchargeTypeDto, UpdateSurchargeTypeDto } from './dto/surcharge-type.dto';

@Injectable()
export class SurchargeTypesService {
  constructor(
    @InjectRepository(SurchargeType)
    private readonly surchargeTypeRepository: Repository<SurchargeType>,
  ) {}

  async findAll(): Promise<SurchargeType[]> {
    return this.surchargeTypeRepository.find({ order: { nombre: 'ASC' } });
  }

  async findActive(): Promise<SurchargeType[]> {
    return this.surchargeTypeRepository.find({ where: { activo: true }, order: { nombre: 'ASC' } });
  }

  async findOne(id: string): Promise<SurchargeType> {
    const st = await this.surchargeTypeRepository.findOne({ where: { id } });
    if (!st) throw new NotFoundException('Tipo de recargo no encontrado');
    return st;
  }

  async create(dto: CreateSurchargeTypeDto): Promise<SurchargeType> {
    const st = this.surchargeTypeRepository.create(dto);
    return this.surchargeTypeRepository.save(st);
  }

  async update(id: string, dto: UpdateSurchargeTypeDto): Promise<SurchargeType> {
    const st = await this.findOne(id);
    Object.assign(st, dto);
    return this.surchargeTypeRepository.save(st);
  }

  async remove(id: string): Promise<void> {
    const st = await this.findOne(id);
    await this.surchargeTypeRepository.remove(st);
  }
}
