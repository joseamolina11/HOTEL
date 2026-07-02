import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto, UpdateOrderStatusDto } from './dto/create-purchase-order.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/auth.interface';

@ApiTags('Purchase Orders')
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly service: PurchaseOrdersService) {}

  @Get()
  @Permissions('purchase-orders:view')
  @ApiOperation({ summary: 'Listar órdenes de compra' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'estado', required: false })
  @ApiQuery({ name: 'supplierId', required: false })
  @ApiQuery({ name: 'desde', required: false })
  @ApiQuery({ name: 'hasta', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('search') search?: string,
    @Query('estado') estado?: string,
    @Query('supplierId') supplierId?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.service.findAll({ search, estado, supplierId, desde, hasta }, +page, +limit);
  }

  @Get(':id')
  @Permissions('purchase-orders:view')
  @ApiOperation({ summary: 'Obtener orden de compra por ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get('code/:codigo')
  @Permissions('purchase-orders:view')
  @ApiOperation({ summary: 'Buscar orden por código' })
  async findByCode(@Param('codigo') codigo: string) {
    return this.service.findByCode(codigo);
  }

  @Post()
  @Permissions('purchase-orders:create')
  @ApiOperation({ summary: 'Crear orden de compra' })
  async create(@Body() dto: CreatePurchaseOrderDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user.sub);
  }

  @Put(':id')
  @Permissions('purchase-orders:edit')
  @ApiOperation({ summary: 'Actualizar orden de compra' })
  async update(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderDto) {
    return this.service.update(id, dto);
  }

  @Put(':id/status')
  @Permissions('purchase-orders:approve')
  @ApiOperation({ summary: 'Cambiar estado de orden de compra' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto, @CurrentUser('sub') userId: string) {
    return this.service.updateStatus(id, dto, userId);
  }

  @Delete(':id')
  @Permissions('purchase-orders:delete')
  @ApiOperation({ summary: 'Eliminar orden de compra' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
