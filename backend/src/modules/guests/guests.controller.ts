import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { GuestsService } from './guests.service';
import { CreateGuestDto, UpdateGuestDto } from './dto/create-guest.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@ApiTags('Guests')
@Controller('guests')
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Get()
  @Permissions('guests:view')
  @ApiOperation({ summary: 'Listar huéspedes' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre o documento' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Resultados por página' })
  async findAll(
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.guestsService.findAll(search, +page, +limit);
  }

  @Get(':id')
  @Permissions('guests:view')
  @ApiOperation({ summary: 'Obtener huésped por ID con historial' })
  async findOne(@Param('id') id: string) {
    return this.guestsService.findOne(id);
  }

  @Post()
  @Permissions('guests:create')
  @ApiOperation({ summary: 'Crear huésped' })
  async create(@Body() createDto: CreateGuestDto) {
    return this.guestsService.create(createDto);
  }

  @Put(':id')
  @Permissions('guests:edit')
  @ApiOperation({ summary: 'Actualizar huésped' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateGuestDto) {
    return this.guestsService.update(id, updateDto);
  }

  @Delete(':id')
  @Permissions('guests:delete')
  @ApiOperation({ summary: 'Eliminar huésped' })
  async remove(@Param('id') id: string) {
    return this.guestsService.remove(id);
  }
}
