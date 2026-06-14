import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsumptionsController } from './consumptions.controller';
import { ConsumptionsService } from './consumptions.service';
import { Consumption } from './entities/consumption.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Consumption, Reservation, InventoryItem])],
  controllers: [ConsumptionsController],
  providers: [ConsumptionsService],
  exports: [ConsumptionsService],
})
export class ConsumptionsModule {}
