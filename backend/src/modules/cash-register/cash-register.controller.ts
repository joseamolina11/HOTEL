import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CashRegisterService } from './cash-register.service';
import { OpenCashRegisterDto, CloseCashRegisterDto } from './dto/create-cash-register.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ROLES } from 'src/common/constants';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/auth.interface';

@ApiTags('Cash Register')
@Controller('cash-register')
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  @Get()
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
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
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Obtener caja abierta actual' })
  async findOpen() {
    return this.cashRegisterService.findOpen();
  }

  @Get(':id')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Obtener cierre por ID' })
  async findOne(@Param('id') id: string) {
    return this.cashRegisterService.findOne(id);
  }

  @Post('open')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Abrir caja' })
  async open(@Body() dto: OpenCashRegisterDto, @CurrentUser() user: JwtPayload) {
    return this.cashRegisterService.open(dto, user.sub);
  }

  @Put(':id/close')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Cerrar caja' })
  async close(@Param('id') id: string, @Body() dto: CloseCashRegisterDto) {
    return this.cashRegisterService.close(id, dto);
  }
}
