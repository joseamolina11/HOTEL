import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AmenitiesService } from './amenities.service';
import { CreateAmenityDto, UpdateAmenityDto } from './dto/create-amenity.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@ApiTags('Amenities')
@Controller('amenities')
export class AmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @Get()
  @Permissions('amenities:view')
  @ApiOperation({ summary: 'Listar todas las amenidades' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Resultados por página' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.amenitiesService.findAll(+page, +limit);
  }

  @Get(':id')
  @Permissions('amenities:view')
  @ApiOperation({ summary: 'Obtener amenidad por ID' })
  async findOne(@Param('id') id: string) {
    return this.amenitiesService.findOne(id);
  }

  @Post()
  @Permissions('amenities:create')
  @ApiOperation({ summary: 'Crear amenidad' })
  async create(@Body() createDto: CreateAmenityDto) {
    return this.amenitiesService.create(createDto);
  }

  @Put(':id')
  @Permissions('amenities:edit')
  @ApiOperation({ summary: 'Actualizar amenidad' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateAmenityDto) {
    return this.amenitiesService.update(id, updateDto);
  }

  @Delete(':id')
  @Permissions('amenities:delete')
  @ApiOperation({ summary: 'Eliminar amenidad' })
  async remove(@Param('id') id: string) {
    return this.amenitiesService.remove(id);
  }
}
