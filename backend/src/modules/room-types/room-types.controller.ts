import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { RoomTypesService } from './room-types.service';
import { CreateRoomTypeDto, UpdateRoomTypeDto } from './dto/create-room-type.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { parseLocalDate } from 'src/common/utils/date';

@ApiTags('Room Types')
@Controller('room-types')
export class RoomTypesController {
  constructor(private readonly roomTypesService: RoomTypesService) {}

  @Get('availability')
  @Permissions('room-types:view')
  @ApiOperation({ summary: 'Disponibilidad de tipos de habitación por fecha' })
  @ApiQuery({ name: 'fechaEntrada', required: true })
  @ApiQuery({ name: 'fechaSalida', required: true })
  async getAvailability(
    @Query('fechaEntrada') fechaEntrada: string,
    @Query('fechaSalida') fechaSalida: string,
  ) {
    return this.roomTypesService.getAvailability(parseLocalDate(fechaEntrada), parseLocalDate(fechaSalida));
  }

  @Get()
  @Permissions('room-types:view')
  @ApiOperation({ summary: 'Listar todos los tipos de habitación' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Resultados por página' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.roomTypesService.findAll(+page, +limit);
  }

  @Get(':id')
  @Permissions('room-types:view')
  @ApiOperation({ summary: 'Obtener tipo de habitación por ID' })
  async findOne(@Param('id') id: string) {
    return this.roomTypesService.findOne(id);
  }

  @Post()
  @Permissions('room-types:create')
  @ApiOperation({ summary: 'Crear tipo de habitación' })
  async create(@Body() createDto: CreateRoomTypeDto) {
    return this.roomTypesService.create(createDto);
  }

  @Put(':id')
  @Permissions('room-types:edit')
  @ApiOperation({ summary: 'Actualizar tipo de habitación' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateRoomTypeDto) {
    return this.roomTypesService.update(id, updateDto);
  }

  @Delete(':id')
  @Permissions('room-types:delete')
  @ApiOperation({ summary: 'Eliminar tipo de habitación' })
  async remove(@Param('id') id: string) {
    return this.roomTypesService.remove(id);
  }
}
