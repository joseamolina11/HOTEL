import { Controller, Get, Put, Query, Body, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';
import {
  SurchargeReportQueryDto,
  DisperseSurchargesDto,
  CashCloseReportQueryDto,
} from './dto/reports.dto';
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

  @Get('cash-close')
  @Permissions('reports:view')
  getCashCloseReport(@Query() query: CashCloseReportQueryDto) {
    return this.service.getCashCloseReport(query);
  }

  @Get('cash-close/:id')
  @Permissions('reports:view')
  getCashCloseDetail(@Param('id') id: string) {
    return this.service.getCashCloseDetail(id);
  }
}
