import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { CreateRoomDto, UpdateRoomDto, ChangeRoomStatusDto } from './dto/create-room.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { parseLocalDate } from 'src/common/utils/date';

@ApiTags('Rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  @Permissions('rooms:view')
  @ApiOperation({ summary: 'Listar todas las habitaciones' })
  @ApiQuery({ name: 'estado', required: false })
  @ApiQuery({ name: 'roomTypeId', required: false })
  async findAll(
    @Query('estado') estado?: string,
    @Query('roomTypeId') roomTypeId?: string,
  ) {
    return this.roomsService.findAll({ estado, roomTypeId });
  }

  @Get('available')
  @Permissions('rooms:view')
  @ApiOperation({ summary: 'Consultar habitaciones disponibles' })
  @ApiQuery({ name: 'fechaEntrada', required: true })
  @ApiQuery({ name: 'fechaSalida', required: true })
  async findAvailable(
    @Query('fechaEntrada') fechaEntrada: string,
    @Query('fechaSalida') fechaSalida: string,
  ) {
    return this.roomsService.findAvailable(parseLocalDate(fechaEntrada), parseLocalDate(fechaSalida));
  }

  @Get('calendar')
  @Permissions('rooms:view')
  @ApiOperation({ summary: 'Calendario de ocupación por rango de fechas' })
  @ApiQuery({ name: 'fechaInicio', required: true })
  @ApiQuery({ name: 'fechaFin', required: true })
  async getCalendar(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) {
    return this.roomsService.getCalendar(parseLocalDate(fechaInicio), parseLocalDate(fechaFin));
  }

  @Get(':id')
  @Permissions('rooms:view')
  @ApiOperation({ summary: 'Obtener habitación por ID' })
  async findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  @Post()
  @Permissions('rooms:create')
  @ApiOperation({ summary: 'Crear habitación' })
  async create(@Body() createDto: CreateRoomDto) {
    return this.roomsService.create(createDto);
  }

  @Put(':id')
  @Permissions('rooms:edit')
  @ApiOperation({ summary: 'Actualizar habitación' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateRoomDto) {
    return this.roomsService.update(id, updateDto);
  }

  @Put(':id/status')
  @Permissions('rooms:change-status')
  @ApiOperation({ summary: 'Cambiar estado de habitación manualmente' })
  async changeStatus(@Param('id') id: string, @Body() changeStatusDto: ChangeRoomStatusDto) {
    return this.roomsService.changeStatus(id, changeStatusDto.estado);
  }

  @Delete(':id')
  @Permissions('rooms:delete')
  @ApiOperation({ summary: 'Eliminar habitación' })
  async remove(@Param('id') id: string) {
    return this.roomsService.remove(id);
  }
}
