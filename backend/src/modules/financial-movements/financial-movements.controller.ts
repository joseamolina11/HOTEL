import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FinancialMovementsService } from './financial-movements.service';
import { CreateFinancialMovementDto, TransferDto } from './dto/create-financial-movement.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/auth.interface';
import { CashRegister } from '../cash-register/entities/cash-register.entity';

@ApiTags('Financial Movements')
@Controller('financial-movements')
export class FinancialMovementsController {
  constructor(
    private readonly service: FinancialMovementsService,
    @InjectRepository(CashRegister)
    private readonly cashRegisterRepo: Repository<CashRegister>,
  ) {}

  @Get()
  @Permissions('financial-movements:view')
  @ApiOperation({ summary: 'Listar movimientos financieros' })
  @ApiQuery({ name: 'accountId', required: false })
  @ApiQuery({ name: 'tipo', required: false })
  @ApiQuery({ name: 'desde', required: false })
  @ApiQuery({ name: 'hasta', required: false })
  @ApiQuery({ name: 'cashRegisterId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('accountId') accountId?: string,
    @Query('tipo') tipo?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('cashRegisterId') cashRegisterId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.service.findAll({ accountId, tipo, desde, hasta, cashRegisterId }, +page, +limit);
  }

  @Get('account/:accountId')
  @Permissions('financial-movements:view')
  @ApiOperation({ summary: 'Movimientos por cuenta' })
  async findByAccount(
    @Param('accountId') accountId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.service.findByAccount(accountId, +page, +limit);
  }

  @Get(':id')
  @Permissions('financial-movements:view')
  @ApiOperation({ summary: 'Obtener movimiento' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('financial-movements:create')
  @ApiOperation({ summary: 'Crear movimiento manual (ajuste/ingreso/egreso)' })
  async create(@Body() dto: CreateFinancialMovementDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user.sub);
  }

  @Post('transfer')
  @Permissions('financial-movements:transfer')
  @ApiOperation({ summary: 'Transferencia entre cuentas' })
  async transfer(@Body() dto: TransferDto, @CurrentUser() user: JwtPayload) {
    if (!dto.cashRegisterId) {
      try {
        const openReg = await this.cashRegisterRepo.findOne({ where: { estado: 'abierta' } });
        if (openReg) dto.cashRegisterId = openReg.id;
      } catch {}
    }
    return this.service.transfer(dto, user.sub);
  }
}
