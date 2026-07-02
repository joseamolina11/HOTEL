import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from './dto/create-payment-method.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@ApiTags('Payment Methods')
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly service: PaymentMethodsService) {}

  @Get()

  @Permissions('payment-methods:view')
  @ApiOperation({ summary: 'Listar métodos de pago' })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 100) {
    return this.service.findAll(+page, +limit);
  }

  @Get('all')

  @Permissions('payment-methods:view')
  @ApiOperation({ summary: 'Todos los métodos activos' })
  async findAllActive() {
    return this.service.findAllActive();
  }

  @Get(':id')

  @Permissions('payment-methods:view')
  @ApiOperation({ summary: 'Obtener método de pago' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()

  @Permissions('payment-methods:create')
  @ApiOperation({ summary: 'Crear método de pago' })
  async create(@Body() dto: CreatePaymentMethodDto) {
    return this.service.create(dto);
  }

  @Put(':id')

  @Permissions('payment-methods:edit')
  @ApiOperation({ summary: 'Actualizar método de pago' })
  async update(@Param('id') id: string, @Body() dto: UpdatePaymentMethodDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')

  @Permissions('payment-methods:delete')
  @ApiOperation({ summary: 'Eliminar método de pago' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
