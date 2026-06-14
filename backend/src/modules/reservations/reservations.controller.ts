import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto, UpdateReservationDto, CancelReservationDto, ReservationFilterDto } from './dto/create-reservation.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ROLES } from 'src/common/constants';

@ApiTags('Reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Listar reservas' })
  @ApiQuery({ name: 'estado', required: false })
  @ApiQuery({ name: 'fechaEntrada', required: false })
  @ApiQuery({ name: 'fechaSalida', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(@Query() filters: ReservationFilterDto) {
    return this.reservationsService.findAll(filters);
  }

  @Get('today')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Reservas del día (llegadas y salidas)' })
  async findToday() {
    return this.reservationsService.findToday();
  }

  @Get(':id')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Obtener reserva por ID con todos los detalles' })
  async findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @Get('code/:codigo')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Buscar reserva por código' })
  async findByCode(@Param('codigo') codigo: string) {
    return this.reservationsService.findByCode(codigo);
  }

  @Post()
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Crear reserva' })
  async create(@Body() createDto: CreateReservationDto) {
    return this.reservationsService.create(createDto);
  }

  @Put(':id')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Modificar reserva' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateReservationDto) {
    return this.reservationsService.update(id, updateDto);
  }

  @Put(':id/cancel')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Cancelar reserva' })
  async cancel(@Param('id') id: string, @Body() cancelDto: CancelReservationDto) {
    return this.reservationsService.cancel(id, cancelDto);
  }

  @Put(':id/confirm')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Confirmar reserva' })
  async confirm(@Param('id') id: string) {
    return this.reservationsService.confirm(id);
  }
}
