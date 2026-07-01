import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from './entities/payment-method.entity';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from './dto/create-payment-method.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly repo: Repository<PaymentMethod>,
  ) {}

  async findAll(page = 1, limit = 100) {
    const [data, total] = await this.repo.findAndCount({
      relations: ['financialAccount'],
      order: { nombre: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllActive() {
    return this.repo.find({
      where: { activo: true },
      relations: ['financialAccount'],
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: string) {
    const method = await this.repo.findOne({
      where: { id },
      relations: ['financialAccount'],
    });
    if (!method) throw new NotFoundException('Método de pago no encontrado');
    return method;
  }

  async create(dto: CreatePaymentMethodDto) {
    const existing = await this.repo.findOne({ where: { nombre: dto.nombre } });
    if (existing) throw new ConflictException('Ya existe un método de pago con ese nombre');
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdatePaymentMethodDto) {
    const method = await this.findOne(id);
    if (dto.nombre && dto.nombre !== method.nombre) {
      const existing = await this.repo.findOne({ where: { nombre: dto.nombre } });
      if (existing) throw new ConflictException('Ya existe un método de pago con ese nombre');
    }
    Object.assign(method, dto);
    return this.repo.save(method);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
