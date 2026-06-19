import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { InventoryCategoryService } from './inventory-category.service';
import { CreateInventoryItemDto, UpdateInventoryItemDto, CreateMovementDto } from './dto/create-inventory-item.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ROLES } from 'src/common/constants';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/auth.interface';

@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly categoryService: InventoryCategoryService,
  ) {}

  @Get()
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Listar productos de inventario' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'categoria', required: false })
  @ApiQuery({ name: 'bajoStock', required: false })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Resultados por página' })
  async findAll(
    @Query('search') search?: string,
    @Query('categoria') categoria?: string,
    @Query('bajoStock') bajoStock?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.inventoryService.findAll({ search, categoria, bajoStock: bajoStock === 'true' }, +page, +limit);
  }

  @Get('low-stock')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Productos con stock bajo' })
  async findLowStock() {
    return this.inventoryService.findLowStock();
  }

  @Get('categories')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Listar categorías de inventario' })
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
  @ApiOperation({ summary: 'Listar todos los movimientos de inventario' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Resultados por página' })
  async findAllMovements(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.inventoryService.findAllMovements(+page, +limit);
  }

  @Post('categories')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Crear categoría de inventario' })
  async createCategory(@Body('nombre') nombre: string, @Body('descripcion') descripcion?: string) {
    return this.categoryService.create(nombre, descripcion);
  }

  @Put('categories/:id')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Actualizar categoría de inventario' })
  async updateCategory(@Param('id') id: string, @Body() data: { nombre?: string; descripcion?: string }) {
    return this.categoryService.update(id, data);
  }

  @Delete('categories/:id')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Eliminar categoría de inventario' })
  async removeCategory(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }

  @Post('movements')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Registrar movimiento de inventario' })
  async createMovement(
    @Body() createMovementDto: CreateMovementDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.inventoryService.createMovement(createMovementDto, user.sub);
  }

  @Get(':id')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Obtener producto por ID' })
  async findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Get(':id/movements')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Historial de movimientos de un producto' })
  async findMovements(@Param('id') id: string) {
    return this.inventoryService.findMovements(id);
  }

  @Post()
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Crear producto de inventario' })
  async create(@Body() createDto: CreateInventoryItemDto) {
    return this.inventoryService.create(createDto);
  }

  @Put(':id')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Actualizar producto de inventario' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateInventoryItemDto) {
    return this.inventoryService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Eliminar producto de inventario' })
  async remove(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }
}
