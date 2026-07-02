import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/create-expense.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('Expenses')
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly service: ExpensesService) {}

  @Get()
  @Permissions('expenses:view')
  @ApiOperation({ summary: 'Listar egresos' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'supplierId', required: false })
  @ApiQuery({ name: 'metodoPagoId', required: false })
  @ApiQuery({ name: 'desde', required: false })
  @ApiQuery({ name: 'hasta', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('categoryId') categoryId?: string,
    @Query('supplierId') supplierId?: string,
    @Query('metodoPagoId') metodoPagoId?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.service.findAll({ categoryId, supplierId, metodoPagoId, desde, hasta, search }, +page, +limit);
  }

  @Get('by-codigo/:codigo')
  @Permissions('expenses:view')
  @ApiOperation({ summary: 'Buscar egreso por código' })
  async findByCodigo(@Param('codigo') codigo: string) {
    return this.service.findByCodigo(codigo);
  }

  @Get('report')
  @Permissions('expenses:report')
  @ApiOperation({ summary: 'Reporte de egresos por período y categoría' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'desde', required: false })
  @ApiQuery({ name: 'hasta', required: false })
  async getReport(
    @Query('categoryId') categoryId?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.service.getReport({ categoryId, desde, hasta });
  }

  @Get(':id')
  @Permissions('expenses:view')
  @ApiOperation({ summary: 'Obtener egreso por ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('expenses:create')
  @ApiOperation({ summary: 'Crear egreso' })
  async create(@Body() dto: CreateExpenseDto, @CurrentUser('sub') userId: string) {
    return this.service.create(dto, userId);
  }

  @Put(':id')
  @Permissions('expenses:edit')
  @ApiOperation({ summary: 'Actualizar egreso' })
  async update(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('expenses:delete')
  @ApiOperation({ summary: 'Eliminar egreso' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
