import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')

  @Permissions('dashboard:view')
  @ApiOperation({ summary: 'Estadísticas operativas en tiempo real' })
  async getStats() {
    return this.dashboardService.getOperationalStats();
  }

  @Get('occupancy')

  @Permissions('dashboard:view')
  @ApiOperation({ summary: 'Ocupación mensual' })
  @ApiQuery({ name: 'year', required: false, example: 2025 })
  @ApiQuery({ name: 'month', required: false, example: 6 })
  async getOccupancy(@Query('year') year?: number, @Query('month') month?: number) {
    return this.dashboardService.getMonthlyOccupancy(year, month);
  }

  @Get('revenue')

  @Permissions('dashboard:view')
  @ApiOperation({ summary: 'Ingresos por mes' })
  @ApiQuery({ name: 'year', required: false, example: 2025 })
  async getRevenue(@Query('year') year?: number) {
    return this.dashboardService.getMonthlyRevenue(year);
  }

  @Get('reservations-by-month')

  @Permissions('dashboard:view')
  @ApiOperation({ summary: 'Reservas por mes' })
  @ApiQuery({ name: 'year', required: false, example: 2025 })
  async getReservationsByMonth(@Query('year') year?: number) {
    return this.dashboardService.getReservationsByMonth(year);
  }
}
