import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ROLES } from 'src/common/constants';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Estadísticas operativas en tiempo real' })
  async getStats() {
    return this.dashboardService.getOperationalStats();
  }

  @Get('occupancy')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Ocupación mensual' })
  @ApiQuery({ name: 'year', required: false, example: 2025 })
  @ApiQuery({ name: 'month', required: false, example: 6 })
  async getOccupancy(@Query('year') year?: number, @Query('month') month?: number) {
    return this.dashboardService.getMonthlyOccupancy(year, month);
  }

  @Get('revenue')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Ingresos por mes' })
  @ApiQuery({ name: 'year', required: false, example: 2025 })
  async getRevenue(@Query('year') year?: number) {
    return this.dashboardService.getMonthlyRevenue(year);
  }

  @Get('reservations-by-month')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Reservas por mes' })
  @ApiQuery({ name: 'year', required: false, example: 2025 })
  async getReservationsByMonth(@Query('year') year?: number) {
    return this.dashboardService.getReservationsByMonth(year);
  }
}
