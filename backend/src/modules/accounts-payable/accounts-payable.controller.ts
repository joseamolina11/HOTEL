import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AccountsPayableService } from './accounts-payable.service';
import { CreateAccountsPayableDto, UpdateAccountsPayableDto, RegisterPagoDto } from './dto/create-accounts-payable.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('Accounts Payable')
@Controller('accounts-payable')
export class AccountsPayableController {
  constructor(private readonly service: AccountsPayableService) {}

  @Get()

  @Permissions('accounts-payable:view')
  @ApiOperation({ summary: 'Listar cuentas por pagar' })
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

  @Get('by-codigo/:codigo')
  @Permissions('accounts-payable:view')
  @ApiOperation({ summary: 'Buscar cuenta por código' })
  async findByCodigo(@Param('codigo') codigo: string) {
    return this.service.findByCodigo(codigo);
  }

  @Get('by-supplier/:supplierId')
  @Permissions('accounts-payable:view')
  @ApiOperation({ summary: 'Cuentas por pagar pendientes de un proveedor' })
  async findBySupplier(@Param('supplierId') supplierId: string) {
    return this.service.findBySupplier(supplierId);
  }

  @Get(':id')
  @Permissions('accounts-payable:view')
  @ApiOperation({ summary: 'Obtener cuenta por ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOneWithPayingExpenses(id);
  }

  @Post()
  @Permissions('accounts-payable:create')
  @ApiOperation({ summary: 'Crear cuenta por pagar' })
  async create(@Body() dto: CreateAccountsPayableDto, @CurrentUser('sub') userId: string) {
    return this.service.create(dto, userId);
  }

  @Put(':id')
  @Permissions('accounts-payable:edit')
  @ApiOperation({ summary: 'Actualizar cuenta por pagar' })
  async update(@Param('id') id: string, @Body() dto: UpdateAccountsPayableDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('accounts-payable:delete')
  @ApiOperation({ summary: 'Eliminar cuenta por pagar' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/pagos')
  @Permissions('accounts-payable:register-payment')
  @ApiOperation({ summary: 'Registrar pago en cuenta por pagar' })
  async registerPago(
    @Param('id') id: string,
    @Body() dto: RegisterPagoDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.registerPago(id, dto, userId);
  }

  @Get(':id/pagos')
  @Permissions('accounts-payable:view')
  @ApiOperation({ summary: 'Obtener historial de pagos de una cuenta' })
  async getPagos(@Param('id') id: string) {
    return this.service.getPagos(id);
  }
}
