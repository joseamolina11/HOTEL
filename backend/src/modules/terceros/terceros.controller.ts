import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { TercerosService } from './terceros.service';
import { CreateTerceroDto, UpdateTerceroDto, TerceroFilterDto } from './dto/tercero.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@Controller('terceros')
export class TercerosController {
  constructor(private readonly service: TercerosService) {}

  @Get()
  @Permissions('terceros:view')
  findAll(@Query() filters: TerceroFilterDto) { return this.service.findAll(filters); }

  @Get('active')
  @Permissions('terceros:view')
  findActive() { return this.service.findAllActive(); }

  @Get(':id')
  @Permissions('terceros:view')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post()
  @Permissions('terceros:create')
  create(@Body() dto: CreateTerceroDto) { return this.service.create(dto); }

  @Put(':id')
  @Permissions('terceros:edit')
  update(@Param('id') id: string, @Body() dto: UpdateTerceroDto) { return this.service.update(id, dto); }

  @Delete(':id')
  @Permissions('terceros:delete')
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
