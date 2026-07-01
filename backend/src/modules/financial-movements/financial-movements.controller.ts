import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FinancialMovementsService } from './financial-movements.service';
import { CreateFinancialMovementDto, TransferDto } from './dto/create-financial-movement.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ROLES } from 'src/common/constants';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/auth.interface';

@ApiTags('Financial Movements')
@Controller('financial-movements')
export class FinancialMovementsController {
  constructor(private readonly service: FinancialMovementsService) {}

  @Get()
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Listar movimientos financieros' })
  @ApiQuery({ name: 'accountId', required: false })
  @ApiQuery({ name: 'tipo', required: false })
  @ApiQuery({ name: 'desde', required: false })
  @ApiQuery({ name: 'hasta', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('accountId') accountId?: string,
    @Query('tipo') tipo?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.service.findAll({ accountId, tipo, desde, hasta }, +page, +limit);
  }

  @Get('account/:accountId')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Movimientos por cuenta' })
  async findByAccount(
    @Param('accountId') accountId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.service.findByAccount(accountId, +page, +limit);
  }

  @Get(':id')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Obtener movimiento' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Crear movimiento manual (ajuste/ingreso/egreso)' })
  async create(@Body() dto: CreateFinancialMovementDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user.sub);
  }

  @Post('transfer')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Transferencia entre cuentas' })
  async transfer(@Body() dto: TransferDto, @CurrentUser() user: JwtPayload) {
    return this.service.transfer(dto, user.sub);
  }
}
