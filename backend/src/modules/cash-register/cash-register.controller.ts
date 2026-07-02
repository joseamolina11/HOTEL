import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CashRegisterService } from './cash-register.service';
import { OpenCashRegisterDto, CloseCashRegisterDto } from './dto/create-cash-register.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/auth.interface';

@ApiTags('Cash Register')
@Controller('cash-register')
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  @Get()
  @Permissions('cash-register:view')
  @ApiOperation({ summary: 'Historial de cierres de caja' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Resultados por página' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.cashRegisterService.findAll(+page, +limit);
  }

  @Get('open')
  @Permissions('cash-register:view')
  @ApiOperation({ summary: 'Obtener caja abierta actual' })
  async findOpen() {
    return this.cashRegisterService.findOpen();
  }

  @Get(':id')
  @Permissions('cash-register:view')
  @ApiOperation({ summary: 'Obtener cierre por ID' })
  async findOne(@Param('id') id: string) {
    return this.cashRegisterService.findOne(id);
  }

  @Get(':id/movements')
  @Permissions('cash-register:view')
  @ApiOperation({ summary: 'Movimientos de un turno de caja' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findMovements(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @CurrentUser() user: JwtPayload,
  ) {
    const userId = user.role === 'admin' ? undefined : user.sub;
    return this.cashRegisterService.findMovements(id, +page, +limit, userId);
  }

  @Post('open')
  @Permissions('cash-register:open')
  @ApiOperation({ summary: 'Abrir caja' })
  async open(@Body() dto: OpenCashRegisterDto, @CurrentUser() user: JwtPayload) {
    return this.cashRegisterService.open(dto, user.sub);
  }

  @Put(':id/close')
  @Permissions('cash-register:close')
  @ApiOperation({ summary: 'Cerrar caja' })
  async close(@Param('id') id: string, @Body() dto: CloseCashRegisterDto) {
    return this.cashRegisterService.close(id, dto);
  }
}
