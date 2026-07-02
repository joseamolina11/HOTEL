import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ExpenseCategoriesService } from './expense-categories.service';
import { CreateExpenseCategoryDto, UpdateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@ApiTags('Expense Categories')
@Controller('expense-categories')
export class ExpenseCategoriesController {
  constructor(private readonly service: ExpenseCategoriesService) {}

  @Get()
  @Permissions('expense-categories:view')
  @ApiOperation({ summary: 'Listar categorías de egreso' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(@Query('search') search?: string, @Query('page') page = 1, @Query('limit') limit = 10) {
    return this.service.findAll(search, +page, +limit);
  }

  @Get('all')
  @Permissions('expense-categories:view')
  @ApiOperation({ summary: 'Listar todas las categorías activas' })
  async findAllActive() {
    return this.service.findAllActive();
  }

  @Get(':id')
  @Permissions('expense-categories:view')
  @ApiOperation({ summary: 'Obtener categoría por ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('expense-categories:create')
  @ApiOperation({ summary: 'Crear categoría de egreso' })
  async create(@Body() dto: CreateExpenseCategoryDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Permissions('expense-categories:edit')
  @ApiOperation({ summary: 'Actualizar categoría de egreso' })
  async update(@Param('id') id: string, @Body() dto: UpdateExpenseCategoryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('expense-categories:delete')
  @ApiOperation({ summary: 'Eliminar categoría de egreso' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
