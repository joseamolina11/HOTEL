import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { SurchargesService } from './surcharges.service';
import { CreateSurchargeDto, SurchargeFilterDto } from './dto/surcharge.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@Controller('surcharges')
export class SurchargesController {
  constructor(private readonly service: SurchargesService) {}

  @Get()
  findAll(@Query() filters: SurchargeFilterDto) { return this.service.findAll(filters); }

  @Get('reservation/:id')
  findByReservation(@Param('id') id: string) { return this.service.findByReservation(id); }

  @Get('total/:reservationId')
  getTotal(@Param('reservationId') id: string) {
    return this.service.getTotalByReservation(id).then((total) => ({ total }));
  }

  @Post()
  // @Permissions('surcharges:create')
  create(@Body() dto: CreateSurchargeDto, @Req() req: Request) {
    const userId = (req.user as any)?.sub;
    return this.service.create(dto, userId);
  }

  @Put(':id')
  // @Permissions('surcharges:update')
  update(@Param('id') id: string, @Body() dto: CreateSurchargeDto) { return this.service.update(id, dto); }

  @Delete(':id')
  // @Permissions('surcharges:delete')
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
