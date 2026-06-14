import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConsumptionsService } from './consumptions.service';
import { CreateConsumptionDto, ConsumptionFilterDto } from './dto/create-consumption.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ROLES } from 'src/common/constants';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/auth.interface';

@ApiTags('Consumptions')
@Controller('consumptions')
export class ConsumptionsController {
  constructor(private readonly consumptionsService: ConsumptionsService) {}

  @Get()
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Listar consumos' })
  async findAll(@Query() filters: ConsumptionFilterDto) {
    return this.consumptionsService.findAll(filters);
  }

  @Post()
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Registrar consumo' })
  async create(@Body() createDto: CreateConsumptionDto, @CurrentUser() user: JwtPayload) {
    return this.consumptionsService.create(createDto, user.sub);
  }

  @Get(':id')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Obtener consumo por ID' })
  async findOne(@Param('id') id: string) {
    return this.consumptionsService.findOne(id);
  }
}
