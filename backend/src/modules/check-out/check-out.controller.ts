import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CheckOutService } from './check-out.service';
import { CheckOutDto } from './dto/check-out.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ROLES } from 'src/common/constants';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/auth.interface';

@ApiTags('Check-Out')
@Controller('check-out')
export class CheckOutController {
  constructor(private readonly checkOutService: CheckOutService) {}

  @Get('pending')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Listar reservas pendientes de check-out' })
  async findPending() {
    return this.checkOutService.findPendingCheckOuts();
  }

  @Get(':reservationId')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Obtener resumen de estancia para check-out' })
  async getStaySummary(@Param('reservationId') reservationId: string) {
    return this.checkOutService.getStaySummary(reservationId);
  }

  @Post()
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Registrar check-out' })
  async checkOut(@Body() checkOutDto: CheckOutDto, @CurrentUser() user: JwtPayload) {
    return this.checkOutService.checkOut(checkOutDto, user.sub);
  }
}
