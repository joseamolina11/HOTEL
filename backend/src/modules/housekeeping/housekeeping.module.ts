import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HousekeepingController } from './housekeeping.controller';
import { HousekeepingService } from './housekeeping.service';
import { Room } from '../rooms/entities/room.entity';
import { SupplyItem } from '../supplies/entities/supply-item.entity';
import { SupplyMovement } from '../supplies/entities/supply-movement.entity';
import { HousekeepingSupply } from './entities/housekeeping-supply.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, SupplyItem, SupplyMovement, HousekeepingSupply]),
  ],
  controllers: [HousekeepingController],
  providers: [HousekeepingService],
})
export class HousekeepingModule {}
