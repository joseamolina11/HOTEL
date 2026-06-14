import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Room } from '../rooms/entities/room.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { Consumption } from '../consumptions/entities/consumption.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Room, Reservation, InventoryItem, Consumption])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
