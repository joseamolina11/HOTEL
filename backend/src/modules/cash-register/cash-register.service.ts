import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashRegister } from './entities/cash-register.entity';
import { OpenCashRegisterDto, CloseCashRegisterDto } from './dto/create-cash-register.dto';
import { FinancialMovementsService } from '../financial-movements/financial-movements.service';
import { FinancialAccountsService } from '../financial-accounts/financial-accounts.service';

@Injectable()
export class CashRegisterService {
  constructor(
    @InjectRepository(CashRegister)
    private readonly repo: Repository<CashRegister>,
    private readonly financialMovementsService: FinancialMovementsService,
    private readonly financialAccountsService: FinancialAccountsService,
  ) {}

  async findAll(page = 1, limit = 10) {
    const [data, total] = await this.repo.findAndCount({
      relations: ['user', 'account'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOpen() {
    return this.repo.findOne({
      where: { estado: 'abierta' },
      relations: ['user', 'account'],
    });
  }

  async open(dto: OpenCashRegisterDto, userId: string) {
    const existing = await this.findOpen();
    if (existing) {
      throw new BadRequestException('Ya hay una caja abierta. Ciérrala antes de abrir una nueva.');
    }

    const register = this.repo.create({
      userId,
      fechaApertura: new Date(),
      montoInicial: dto.montoInicial,
      totalVentas: 0,
      totalEfectivo: 0,
      totalTransferencia: 0,
      totalTarjeta: 0,
      totalOtros: 0,
      cantidadTransacciones: 0,
      estado: 'abierta',
      observaciones: dto.observaciones,
    });

    // Link to caja_menor account (informational, no balance-affecting movement)
    try {
      const accounts = await this.financialAccountsService.findAllActive();
      const cajaMenor = accounts.find(a => a.tipo === 'caja_menor') || accounts[0];
      if (cajaMenor) {
        register.accountId = cajaMenor.id;
      }
    } catch (e) {
      // silently skip
    }

    return this.repo.save(register);
  }

  async close(id: string, dto: CloseCashRegisterDto) {
    const register = await this.repo.findOne({ where: { id } });
    if (!register) throw new NotFoundException('Caja no encontrada');
    if (register.estado === 'cerrada') throw new BadRequestException('La caja ya está cerrada');

    const totalDeclarado = dto.totalEfectivo + dto.totalTransferencia + dto.totalTarjeta + dto.totalOtros;
    const diferencia = dto.diferencia ?? (totalDeclarado - Number(register.totalVentas));

    Object.assign(register, {
      fechaCierre: new Date(),
      totalEfectivo: dto.totalEfectivo,
      totalTransferencia: dto.totalTransferencia,
      totalTarjeta: dto.totalTarjeta,
      totalOtros: dto.totalOtros,
      cantidadTransacciones: dto.cantidadTransacciones,
      diferencia,
      observaciones: dto.observaciones,
      estado: 'cerrada' as const,
    });

    return this.repo.save(register);
  }

  async findOne(id: string) {
    const register = await this.repo.findOne({
      where: { id },
      relations: ['user', 'account'],
    });
    if (!register) throw new NotFoundException('Caja no encontrada');
    return register;
  }

  async findMovements(id: string, page = 1, limit = 20, userId?: string) {
    const register = await this.findOne(id);
    const movements = await this.financialMovementsService.findAll({ cashRegisterId: id, userId }, page, limit);
    return {
      register,
      movements,
    };
  }
}
