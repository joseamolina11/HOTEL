import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OtaService } from './ota.service';
import { SyncAvailabilityDto, ImportReservationsDto, OtaConfigDto } from './dto/ota.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ROLES } from 'src/common/constants';

@ApiTags('OTA')
@Controller('ota')
export class OtaController {
  constructor(private readonly otaService: OtaService) {}

  @Post('import')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Importar reservas desde OTA (Booking/Airbnb)' })
  async importReservations(@Body() importDto: ImportReservationsDto) {
    return this.otaService.importReservations(importDto.source);
  }

  @Post('sync-availability')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Sincronizar disponibilidad con OTA' })
  async syncAvailability(@Body() syncDto: SyncAvailabilityDto) {
    return this.otaService.syncAvailability(
      syncDto.roomId,
      syncDto.available !== false,
      new Date(syncDto.startDate),
      new Date(syncDto.endDate),
    );
  }

  @Get('status')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Estado de las conexiones OTA' })
  async getStatus() {
    return this.otaService.getConnectionStatus();
  }

  @Post('configure')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Configurar credenciales OTA' })
  async configure(@Body() configDto: OtaConfigDto) {
    return this.otaService.configure(configDto);
  }
}
