import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurchargeType } from './entities/surcharge-type.entity';
import { Tercero } from '../terceros/entities/tercero.entity';
import { CreateSurchargeTypeDto, UpdateSurchargeTypeDto } from './dto/surcharge-type.dto';

@Injectable()
export class SurchargeTypesService {
  constructor(
    @InjectRepository(SurchargeType)
    private readonly surchargeTypeRepository: Repository<SurchargeType>,
    @InjectRepository(Tercero)
    private readonly terceroRepository: Repository<Tercero>,
  ) {}

  async findAll(): Promise<SurchargeType[]> {
    return this.surchargeTypeRepository.find({ relations: ['tercero'], order: { nombre: 'ASC' } });
  }

  async findActive(): Promise<SurchargeType[]> {
    return this.surchargeTypeRepository.find({ where: { activo: true }, relations: ['tercero'], order: { nombre: 'ASC' } });
  }

  async findOne(id: string): Promise<SurchargeType> {
    const st = await this.surchargeTypeRepository.findOne({ where: { id }, relations: ['tercero'] });
    if (!st) throw new NotFoundException('Tipo de recargo no encontrado');
    return st;
  }

  private async validateTercero(terceroId?: string) {
    if (!terceroId) return;
    const tercero = await this.terceroRepository.findOne({ where: { id: terceroId } });
    if (!tercero) throw new NotFoundException('Tercero no encontrado');
  }

  async create(dto: CreateSurchargeTypeDto): Promise<SurchargeType> {
    await this.validateTercero(dto.terceroId);
    const st = this.surchargeTypeRepository.create(dto);
    return this.surchargeTypeRepository.save(st);
  }

  async update(id: string, dto: UpdateSurchargeTypeDto): Promise<SurchargeType> {
    const st = await this.findOne(id);
    if (dto.terceroId) await this.validateTercero(dto.terceroId);
    Object.assign(st, dto);
    return this.surchargeTypeRepository.save(st);
  }

  async remove(id: string): Promise<void> {
    const st = await this.findOne(id);
    await this.surchargeTypeRepository.remove(st);
  }
}
