import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AccountsPayableService } from './accounts-payable.service';
import { CreateAccountsPayableDto, UpdateAccountsPayableDto, RegisterPagoDto } from './dto/create-accounts-payable.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ROLES } from 'src/common/constants';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/auth.interface';

@ApiTags('Accounts Payable')
@Controller('accounts-payable')
export class AccountsPayableController {
  constructor(private readonly service: AccountsPayableService) {}

  @Get()
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
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
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Buscar cuenta por código' })
  async findByCodigo(@Param('codigo') codigo: string) {
    return this.service.findByCodigo(codigo);
  }

  @Get('by-supplier/:supplierId')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Cuentas por pagar pendientes de un proveedor' })
  async findBySupplier(@Param('supplierId') supplierId: string) {
    return this.service.findBySupplier(supplierId);
  }

  @Get(':id')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Obtener cuenta por ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOneWithPayingExpenses(id);
  }

  @Post()
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Crear cuenta por pagar' })
  async create(@Body() dto: CreateAccountsPayableDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user.sub);
  }

  @Put(':id')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Actualizar cuenta por pagar' })
  async update(@Param('id') id: string, @Body() dto: UpdateAccountsPayableDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Eliminar cuenta por pagar' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/pagos')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Registrar pago en cuenta por pagar' })
  async registerPago(
    @Param('id') id: string,
    @Body() dto: RegisterPagoDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.registerPago(id, dto, user.sub);
  }

  @Get(':id/pagos')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Obtener historial de pagos de una cuenta' })
  async getPagos(@Param('id') id: string) {
    return this.service.getPagos(id);
  }
}
