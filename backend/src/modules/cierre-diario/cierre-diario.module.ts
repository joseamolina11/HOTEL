import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { CierreDiarioService } from './cierre-diario.service';
import { Surcharge } from '../surcharges/entities/surcharge.entity';
import { Order } from '../orders/entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Surcharge, Order]),
  ],
  providers: [CierreDiarioService],
})
export class CierreDiarioModule {}
