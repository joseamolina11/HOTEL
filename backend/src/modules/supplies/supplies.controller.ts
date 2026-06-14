import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SuppliesService } from './supplies.service';
import { SupplyCategoryService } from './supply-category.service';
import { CreateSupplyItemDto, UpdateSupplyItemDto, CreateSupplyMovementDto } from './dto/create-supply-item.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ROLES } from 'src/common/constants';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/auth.interface';

@ApiTags('Supplies')
@Controller('supplies')
export class SuppliesController {
  constructor(
    private readonly suppliesService: SuppliesService,
    private readonly categoryService: SupplyCategoryService,
  ) {}

  @Get()
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Listar insumos' })
  @ApiQuery({ name: 'categoria', required: false })
  @ApiQuery({ name: 'bajoStock', required: false })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Resultados por página' })
  async findAll(
    @Query('categoria') categoria?: string,
    @Query('bajoStock') bajoStock?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.suppliesService.findAll({ categoria, bajoStock: bajoStock === 'true' }, +page, +limit);
  }

  @Get('low-stock')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Insumos con stock bajo' })
  async findLowStock() {
    return this.suppliesService.findLowStock();
  }

  @Get('categories')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Listar categorías de insumos' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Resultados por página' })
  async findCategories(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.categoryService.findAll(+page, +limit);
  }

  @Get('movements')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Listar todos los movimientos de insumos' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Resultados por página' })
  async findAllMovements(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.suppliesService.findAllMovements(+page, +limit);
  }

  @Post('categories')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Crear categoría de insumo' })
  async createCategory(@Body('nombre') nombre: string, @Body('descripcion') descripcion?: string) {
    return this.categoryService.create(nombre, descripcion);
  }

  @Put('categories/:id')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Actualizar categoría de insumo' })
  async updateCategory(@Param('id') id: string, @Body() data: { nombre?: string; descripcion?: string }) {
    return this.categoryService.update(id, data);
  }

  @Delete('categories/:id')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Eliminar categoría de insumo' })
  async removeCategory(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }

  @Post('movements')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Registrar movimiento de insumo' })
  async createMovement(
    @Body() createMovementDto: CreateSupplyMovementDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.suppliesService.createMovement(createMovementDto, user.sub);
  }

  @Get(':id')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Obtener insumo por ID' })
  async findOne(@Param('id') id: string) {
    return this.suppliesService.findOne(id);
  }

  @Get(':id/movements')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Historial de movimientos de un insumo' })
  async findMovements(@Param('id') id: string) {
    return this.suppliesService.findMovements(id);
  }

  @Post()
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Crear insumo' })
  async create(@Body() createDto: CreateSupplyItemDto) {
    return this.suppliesService.create(createDto);
  }

  @Put(':id')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Actualizar insumo' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateSupplyItemDto) {
    return this.suppliesService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Eliminar insumo' })
  async remove(@Param('id') id: string) {
    return this.suppliesService.remove(id);
  }
}
