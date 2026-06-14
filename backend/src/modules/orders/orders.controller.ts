import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ROLES } from 'src/common/constants';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/auth.interface';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Listar pedidos' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Resultados por página' })
  async findAll(
    @Query('roomId') roomId?: string,
    @Query('estado') estado?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.ordersService.findAll({ roomId, estado }, +page, +limit);
  }

  @Get('pending-by-room')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Consumos pendientes agrupados por habitación' })
  async getPendingByRoom() {
    return this.ordersService.getPendingByRoom();
  }

  @Get('room/:roomId')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Pedidos de una habitación' })
  async findByRoom(@Param('roomId') roomId: string) {
    return this.ordersService.findByRoom(roomId);
  }

  @Get(':id')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Obtener pedido por ID' })
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post()
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Crear pedido' })
  async create(@Body() createDto: CreateOrderDto, @CurrentUser() user: JwtPayload) {
    return this.ordersService.create(createDto, user.sub);
  }

  @Put(':id/cancel')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Cancelar pedido' })
  async cancel(@Param('id') id: string) {
    return this.ordersService.cancel(id);
  }
}
