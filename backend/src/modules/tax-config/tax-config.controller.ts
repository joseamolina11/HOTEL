import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TaxConfigService } from './tax-config.service';
import { CreateTaxConfigDto, UpdateTaxConfigDto } from './dto/create-tax-config.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ROLES } from 'src/common/constants';

@ApiTags('Tax Config')
@Controller('tax-config')
export class TaxConfigController {
  constructor(private readonly service: TaxConfigService) {}

  @Get()
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Listar configuraciones de impuesto' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.service.findAll(+page, +limit);
  }

  @Get('active')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Listar impuestos activos' })
  async findAllActive() {
    return this.service.findAllActive();
  }

  @Get('default')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Obtener impuesto por defecto' })
  async findDefault() {
    return this.service.findDefault();
  }

  @Get(':id')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Obtener impuesto por ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Crear configuración de impuesto' })
  async create(@Body() dto: CreateTaxConfigDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Actualizar configuración de impuesto' })
  async update(@Param('id') id: string, @Body() dto: UpdateTaxConfigDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Eliminar configuración de impuesto' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
