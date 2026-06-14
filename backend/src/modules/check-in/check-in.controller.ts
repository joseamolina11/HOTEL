import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CheckInService } from './check-in.service';
import { CheckInDto } from './dto/check-in.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ROLES } from 'src/common/constants';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/auth.interface';

@ApiTags('Check-In')
@Controller('check-in')
export class CheckInController {
  constructor(private readonly checkInService: CheckInService) {}

  @Get('pending')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Listar reservas pendientes de check-in (confirmadas para hoy)' })
  async findPending() {
    return this.checkInService.findPendingCheckIns();
  }

  @Post()
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Registrar check-in' })
  async checkIn(@Body() checkInDto: CheckInDto, @CurrentUser() user: JwtPayload) {
    console.log(user);
    return this.checkInService.checkIn(checkInDto, user.sub);
  }

  @Get(':reservationId')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Obtener check-in de una reserva' })
  async findByReservation(@Param('reservationId') reservationId: string) {
    return this.checkInService.findByReservation(reservationId);
  }
}
