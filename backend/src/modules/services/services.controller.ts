import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/create-service.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly service: ServicesService) {}

  @Get()
  @Permissions('services:view')
  @ApiOperation({ summary: 'Listar servicios' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(@Query('search') search?: string, @Query('page') page = 1, @Query('limit') limit = 10) {
    return this.service.findAll(search, +page, +limit);
  }

  @Get('all')
  @Permissions('services:view')
  @ApiOperation({ summary: 'Listar todos los servicios activos' })
  async findAllActive() {
    return this.service.findAllActive();
  }

  @Get(':id')
  @Permissions('services:view')
  @ApiOperation({ summary: 'Obtener servicio por ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('services:create')
  @ApiOperation({ summary: 'Crear servicio' })
  async create(@Body() dto: CreateServiceDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Permissions('services:edit')
  @ApiOperation({ summary: 'Actualizar servicio' })
  async update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('services:delete')
  @ApiOperation({ summary: 'Eliminar servicio' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
