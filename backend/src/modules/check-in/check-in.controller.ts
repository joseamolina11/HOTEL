import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CheckInService } from './check-in.service';
import { CheckInDto } from './dto/check-in.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/auth.interface';

@ApiTags('Check-In')
@Controller('check-in')
export class CheckInController {
  constructor(private readonly checkInService: CheckInService) {}

  @Get('pending')
  @Permissions('check-in:view')
  @ApiOperation({ summary: 'Listar reservas pendientes de check-in (confirmadas para hoy)' })
  async findPending() {
    return this.checkInService.findPendingCheckIns();
  }

  @Post()
  @Permissions('check-in:create')
  @ApiOperation({ summary: 'Registrar check-in' })
  async checkIn(@Body() checkInDto: CheckInDto, @CurrentUser() user: JwtPayload) {
    console.log(user);
    return this.checkInService.checkIn(checkInDto, user.sub);
  }

  @Get(':reservationId')
  @Permissions('check-in:view')
  @ApiOperation({ summary: 'Obtener check-in de una reserva' })
  async findByReservation(@Param('reservationId') reservationId: string) {
    return this.checkInService.findByReservation(reservationId);
  }
}
