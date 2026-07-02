import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FinancialAccountsService } from './financial-accounts.service';
import { CreateFinancialAccountDto, UpdateFinancialAccountDto } from './dto/create-financial-account.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@ApiTags('Financial Accounts')
@Controller('financial-accounts')
export class FinancialAccountsController {
  constructor(private readonly service: FinancialAccountsService) {}

  @Get()
  @Permissions('financial-accounts:view')
  @ApiOperation({ summary: 'Listar cuentas financieras' })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 100) {
    return this.service.findAll(+page, +limit);
  }

  @Get('all')
  @Permissions('financial-accounts:view')
  @ApiOperation({ summary: 'Todas las cuentas activas' })
  async findAllActive() {
    return this.service.findAllActive();
  }

  @Get(':id')
  @Permissions('financial-accounts:view')
  @ApiOperation({ summary: 'Obtener cuenta financiera' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('financial-accounts:create')
  @ApiOperation({ summary: 'Crear cuenta financiera' })
  async create(@Body() dto: CreateFinancialAccountDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Permissions('financial-accounts:edit')
  @ApiOperation({ summary: 'Actualizar cuenta financiera' })
  async update(@Param('id') id: string, @Body() dto: UpdateFinancialAccountDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('financial-accounts:delete')
  @ApiOperation({ summary: 'Eliminar cuenta financiera' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
