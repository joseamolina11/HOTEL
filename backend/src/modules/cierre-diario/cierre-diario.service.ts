import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Surcharge } from '../surcharges/entities/surcharge.entity';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class CierreDiarioService {
  private readonly logger = new Logger(CierreDiarioService.name);

  constructor(
    @InjectRepository(Surcharge)
    private readonly surchargeRepo: Repository<Surcharge>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  // @Cron(CronExpression.EVERY_DAY_AT_3AM)
  @Cron(CronExpression.EVERY_5_MINUTES)
  async ejecutarCierre() {
    this.logger.log('Iniciando cierre diario (3:00 AM)...');

    const [surchargesUpdated, ordersUpdated] = await Promise.all([
      this.surchargeRepo.update({ estado: 'borrador' }, { estado: 'cargado' }),
      this.orderRepo.update({ estado: 'borrador' }, { estado: 'cargado' }),
    ]);

    this.logger.log(`Cierre completado: ${surchargesUpdated.affected ?? 0} recargos y ${ordersUpdated.affected ?? 0} pedidos cargados`);
  }
}
