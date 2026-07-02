import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReciboCajaService } from './recibo-caja.service';
import { CreateReciboCajaDto } from './dto/create-recibo-caja.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('Recibo Caja')
@Controller('recibo-caja')
export class ReciboCajaController {
  constructor(private readonly service: ReciboCajaService) {}

  @Get()
  @Permissions('recibo-caja:view')
  @ApiOperation({ summary: 'Listar recibos de caja' })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.service.findAll(+page, +limit);
  }

  @Get('/by-reservation/:reservationId')
  @Permissions('recibo-caja:view')
  @ApiOperation({ summary: 'Obtener recibo por ID de reserva' })
  async findByReservation(@Param('reservationId') reservationId: string) {
    return this.service.findByReservation(reservationId);
  }

  @Get(':id')
  @Permissions('recibo-caja:view')
  @ApiOperation({ summary: 'Obtener recibo por ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('recibo-caja:create')
  @ApiOperation({ summary: 'Crear recibo de caja' })
  async create(@Body() dto: CreateReciboCajaDto, @CurrentUser('sub') userId: string) {
    return this.service.create(dto, userId);
  }

  @Delete(':id')
  @Permissions('recibo-caja:delete')
  @ApiOperation({ summary: 'Eliminar recibo' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
