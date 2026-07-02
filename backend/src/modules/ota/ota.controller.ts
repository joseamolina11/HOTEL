import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OtaService } from './ota.service';
import { SyncAvailabilityDto, ImportReservationsDto, OtaConfigDto } from './dto/ota.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@ApiTags('OTA')
@Controller('ota')
export class OtaController {
  constructor(private readonly otaService: OtaService) {}

  @Post('import')

  @Permissions('ota:configure')
  @ApiOperation({ summary: 'Importar reservas desde OTA (Booking/Airbnb)' })
  async importReservations(@Body() importDto: ImportReservationsDto) {
    return this.otaService.importReservations(importDto.source);
  }

  @Post('sync-availability')

  @Permissions('ota:configure')
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

  @Permissions('ota:view')
  @ApiOperation({ summary: 'Estado de las conexiones OTA' })
  async getStatus() {
    return this.otaService.getConnectionStatus();
  }

  @Post('configure')

  @Permissions('ota:configure')
  @ApiOperation({ summary: 'Configurar credenciales OTA' })
  async configure(@Body() configDto: OtaConfigDto) {
    return this.otaService.configure(configDto);
  }
}
