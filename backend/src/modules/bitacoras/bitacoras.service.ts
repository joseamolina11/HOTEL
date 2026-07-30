import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Bitacora } from './entities/bitacora.entity';
import { CreateBitacoraDto, BitacoraFilterDto } from './dto/bitacora.dto';

@Injectable()
export class BitacorasService {
  constructor(
    @InjectRepository(Bitacora)
    private readonly bitacoraRepository: Repository<Bitacora>,
  ) {}

  async create(dto: CreateBitacoraDto, userId: string): Promise<Bitacora> {
    const bitacora = this.bitacoraRepository.create({
      contenido: dto.contenido,
      createdById: userId,
    });
    return this.bitacoraRepository.save(bitacora);
  }

  async findAll(filters: BitacoraFilterDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.fechaDesde && filters.fechaHasta) {
      where.createdAt = Between(
        new Date(filters.fechaDesde),
        new Date(new Date(filters.fechaHasta).setHours(23, 59, 59, 999)),
      );
    } else if (filters.fechaDesde) {
      where.createdAt = Between(
        new Date(filters.fechaDesde),
        new Date(new Date(filters.fechaDesde).setHours(23, 59, 59, 999)),
      );
    } else if (filters.fechaHasta) {
      where.createdAt = Between(
        new Date(new Date(filters.fechaHasta).setHours(0, 0, 0, 0)),
        new Date(new Date(filters.fechaHasta).setHours(23, 59, 59, 999)),
      );
    }

    const [data, total] = await this.bitacoraRepository.findAndCount({
      where,
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
