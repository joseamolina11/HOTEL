import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinancialAccount } from './entities/financial-account.entity';
import { CreateFinancialAccountDto, UpdateFinancialAccountDto } from './dto/create-financial-account.dto';

@Injectable()
export class FinancialAccountsService {
  constructor(
    @InjectRepository(FinancialAccount)
    private readonly repo: Repository<FinancialAccount>,
  ) {}

  async findAll(page = 1, limit = 100) {
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

  async findOne(id: string) {
    const account = await this.repo.findOne({ where: { id } });
    if (!account) throw new NotFoundException('Cuenta financiera no encontrada');
    return account;
  }

  async create(dto: CreateFinancialAccountDto) {
    const existing = await this.repo.findOne({ where: { nombre: dto.nombre } });
    if (existing) throw new ConflictException('Ya existe una cuenta con ese nombre');
    return this.repo.save(this.repo.create({
      nombre: dto.nombre,
      tipo: dto.tipo,
      saldo: dto.saldoInicial || 0,
      descripcion: dto.descripcion,
    }));
  }

  async update(id: string, dto: UpdateFinancialAccountDto) {
    const account = await this.findOne(id);
    if (dto.nombre && dto.nombre !== account.nombre) {
      const existing = await this.repo.findOne({ where: { nombre: dto.nombre } });
      if (existing) throw new ConflictException('Ya existe una cuenta con ese nombre');
    }
    if (dto.saldoInicial !== undefined) {
      (account as any).saldo = dto.saldoInicial;
    }
    Object.assign(account, dto);
    return this.repo.save(account);
  }

  async updateBalance(id: string, amount: number) {
    const account = await this.findOne(id);
    const newBalance = Number(account.saldo) + amount;
    account.saldo = newBalance;
    return this.repo.save(account);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
