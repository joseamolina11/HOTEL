import { Controller, Get, Post, Body, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { BitacorasService } from './bitacoras.service';
import { CreateBitacoraDto, BitacoraFilterDto } from './dto/bitacora.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@Controller('bitacoras')
export class BitacorasController {
  constructor(private readonly service: BitacorasService) {}

  @Post()
  @Permissions('bitacoras:create')
  create(@Body() dto: CreateBitacoraDto, @Req() req: Request) {
    const userId = (req.user as any)?.sub;
    return this.service.create(dto, userId);
  }

  @Get()
  @Permissions('bitacoras:view')
  findAll(@Query() filters: BitacoraFilterDto) {
    return this.service.findAll(filters);
  }
}
