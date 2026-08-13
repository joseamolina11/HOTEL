import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReservationsService } from './reservations.service';

@Injectable()
export class ReservationsCronService {
  private readonly logger = new Logger(ReservationsCronService.name);

  constructor(private readonly reservationsService: ReservationsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async autoExtendOverdueCheckins() {
    this.logger.log('Iniciando extensión automática de reservas en check-in con salida vencida...');
    try {
      const count = await this.reservationsService.autoExtendOverdueCheckins();
      this.logger.log(`Extensión automática completada: ${count} reserva(s) extendida(s)`);
    } catch (e: any) {
      this.logger.error(`Error en extensión automática: ${e?.message || e}`);
    }
  }
}
