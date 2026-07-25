import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { SurchargeTypesService } from './surcharge-types.service';
import { CreateSurchargeTypeDto, UpdateSurchargeTypeDto } from './dto/surcharge-type.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@Controller('surcharge-types')
export class SurchargeTypesController {
  constructor(private readonly service: SurchargeTypesService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Get('active')
  findActive() { return this.service.findActive(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post()
  @Permissions('surcharges:create')
  create(@Body() dto: CreateSurchargeTypeDto) { return this.service.create(dto); }

  @Put(':id')
  @Permissions('surcharges:edit')
  update(@Param('id') id: string, @Body() dto: UpdateSurchargeTypeDto) { return this.service.update(id, dto); }

  @Delete(':id')
  @Permissions('surcharges:delete')
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
