import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RecordControlService } from './record-control.service';
import { RecordControlFilterDto } from './dto/record-control.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@ApiTags('Record Control')
@Controller('record-control')
export class RecordControlController {
  constructor(private readonly recordControlService: RecordControlService) {}

  @Get('deleted-reservations')
  @Permissions('record-control:view')
  @ApiOperation({ summary: 'Reservas eliminadas (canceladas)' })
  getDeletedReservations(@Query() filters: RecordControlFilterDto) {
    return this.recordControlService.getDeletedReservations(filters);
  }

  @Get('deleted-surcharges')
  @Permissions('record-control:view')
  @ApiOperation({ summary: 'Recargos eliminados' })
  getDeletedSurcharges(@Query() filters: RecordControlFilterDto) {
    return this.recordControlService.getDeletedSurcharges(filters);
  }

  @Get('discounts')
  @Permissions('record-control:view')
  @ApiOperation({ summary: 'Descuentos realizados' })
  getDiscounts(@Query() filters: RecordControlFilterDto) {
    return this.recordControlService.getDiscounts(filters);
  }

  @Get('unpaid-reservations')
  @Permissions('record-control:view')
  @ApiOperation({ summary: 'Reservas sin pagar' })
  getUnpaidReservations(@Query() filters: RecordControlFilterDto) {
    return this.recordControlService.getUnpaidReservations(filters);
  }
}
