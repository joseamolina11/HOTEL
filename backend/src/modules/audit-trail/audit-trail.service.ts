import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditTrailService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async log(data: {
    userId?: string;
    accion: string;
    entidad: string;
    entidadId: string;
    detalle?: any;
    ipAddress?: string;
  }) {
    return this.repo.save(this.repo.create(data));
  }

  async findAll(filters?: { entidad?: string; entidadId?: string }, page = 1, limit = 50) {
    const where: any = {};
    if (filters?.entidad) where.entidad = filters.entidad;
    if (filters?.entidadId) where.entidadId = filters.entidadId;

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByEntity(entidad: string, entidadId: string) {
    return this.repo.find({
      where: { entidad, entidadId },
      order: { createdAt: 'DESC' },
    });
  }
}
