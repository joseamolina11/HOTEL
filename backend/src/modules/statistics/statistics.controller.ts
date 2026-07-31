import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { StatisticsFilterDto } from './dto/statistics.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@ApiTags('Statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('gerencial')
  @Permissions('statistics:view')
  @ApiOperation({ summary: 'Reporte gerencial: ventas por fecha, formas de pago, egresos' })
  getGerencial(@Query() filters: StatisticsFilterDto) {
    return this.statisticsService.getGerencial(filters);
  }
}
