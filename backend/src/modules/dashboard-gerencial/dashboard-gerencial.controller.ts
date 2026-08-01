import { Controller, Get, Query, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { DashboardGerencialService } from './dashboard-gerencial.service';
import { CalendarQueryDto, EventQueryDto, CreateCalendarEventDto, UpdateCalendarEventDto } from './dto/dashboard-gerencial.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('Dashboard Gerencial')
@Controller('dashboard-gerencial')
export class DashboardGerencialController {
  constructor(private readonly dashboardGerencialService: DashboardGerencialService) {}

  @Get('summary')
  @Permissions('dashboard-gerencial:view')
  @ApiOperation({ summary: 'Resumen ejecutivo: ocupación, ingresos, ADR/RevPAR, llegadas/salidas, alertas e insights' })
  getSummary() {
    return this.dashboardGerencialService.getSummary();
  }

  @Get('calendar')
  @Permissions('dashboard-gerencial:view')
  @ApiOperation({ summary: 'Calendario gerencial: habitaciones, reservaciones y eventos en rango de fechas' })
  getCalendar(@Query() query: CalendarQueryDto) {
    return this.dashboardGerencialService.getCalendar(query.inicio, query.fin);
  }

  @Get('events')
  @Permissions('dashboard-gerencial:view')
  @ApiOperation({ summary: 'Listar eventos del calendario gerencial' })
  getEvents(@Query() query: EventQueryDto) {
    return this.dashboardGerencialService.getEvents(query.desde, query.hasta);
  }

  @Post('events')
  @Permissions('dashboard-gerencial:view')
  @ApiOperation({ summary: 'Crear evento del calendario gerencial' })
  createEvent(@Body() dto: CreateCalendarEventDto, @CurrentUser('sub') userId: string) {
    return this.dashboardGerencialService.createEvent(dto, userId);
  }

  @Put('events/:id')
  @Permissions('dashboard-gerencial:view')
  @ApiOperation({ summary: 'Actualizar evento del calendario gerencial' })
  @ApiParam({ name: 'id' })
  updateEvent(@Param('id') id: string, @Body() dto: UpdateCalendarEventDto) {
    return this.dashboardGerencialService.updateEvent(id, dto);
  }

  @Delete('events/:id')
  @Permissions('dashboard-gerencial:view')
  @ApiOperation({ summary: 'Eliminar evento del calendario gerencial' })
  @ApiParam({ name: 'id' })
  deleteEvent(@Param('id') id: string) {
    return this.dashboardGerencialService.deleteEvent(id);
  }
}
