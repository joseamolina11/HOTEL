import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MincitService } from './mincit.service';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@ApiTags('MinCIT')
@Controller('mincit')
export class MincitController {
  constructor(private readonly mincitService: MincitService) {}

  @Get('envios')
  @Permissions('reports:view')
  @ApiOperation({ summary: 'Listar envíos al sistema MinCIT' })
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.mincitService.findAll(page ? Number(page) : 1, limit ? Number(limit) : 20);
  }

  @Get('envios/reservation/:reservationId')
  @Permissions('reports:view')
  @ApiOperation({ summary: 'Envíos MinCIT de una reserva' })
  async findByReservation(@Param('reservationId') reservationId: string) {
    return this.mincitService.findByReservation(reservationId);
  }

  @Post('envios/:id/reintentar')
  @Permissions('reports:view')
  @ApiOperation({ summary: 'Reintentar un envío MinCIT' })
  async reintentar(@Param('id') id: string) {
    return this.mincitService.reintentar(id);
  }
}
