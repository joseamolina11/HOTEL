import { Controller, Get, Put, Query, Body } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { SurchargeReportQueryDto, DisperseSurchargesDto } from './dto/reports.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('surcharges')
  @Permissions('reports:view')
  getSurchargesReport(@Query() query: SurchargeReportQueryDto) {
    return this.service.getSurchargesReport(query);
  }

  @Put('surcharges/disperse')
  @Permissions('reports:disperse')
  disperse(@Body() dto: DisperseSurchargesDto) {
    return this.service.disperseSurcharges(dto.ids, dto.disperse !== false);
  }
}
