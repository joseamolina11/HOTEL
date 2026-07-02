import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CheckOutService } from './check-out.service';
import { CheckOutDto } from './dto/check-out.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/auth.interface';

@ApiTags('Check-Out')
@Controller('check-out')
export class CheckOutController {
  constructor(private readonly checkOutService: CheckOutService) {}

  @Get('pending')
  @Permissions('check-out:view')
  @ApiOperation({ summary: 'Listar reservas pendientes de check-out' })
  async findPending() {
    return this.checkOutService.findPendingCheckOuts();
  }

  @Get(':reservationId')
  @Permissions('check-out:view')
  @ApiOperation({ summary: 'Obtener resumen de estancia para check-out' })
  async getStaySummary(@Param('reservationId') reservationId: string) {
    return this.checkOutService.getStaySummary(reservationId);
  }

  @Post()
  @Permissions('check-out:create')
  @ApiOperation({ summary: 'Registrar check-out' })
  async checkOut(@Body() checkOutDto: CheckOutDto, @CurrentUser() user: JwtPayload) {
    return this.checkOutService.checkOut(checkOutDto, user.sub);
  }
}
