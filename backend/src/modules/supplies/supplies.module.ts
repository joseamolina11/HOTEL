import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuppliesController } from './supplies.controller';
import { SuppliesService } from './supplies.service';
import { SupplyCategoryService } from './supply-category.service';
import { SupplyItem } from './entities/supply-item.entity';
import { SupplyMovement } from './entities/supply-movement.entity';
import { SupplyCategory } from './entities/supply-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SupplyItem, SupplyMovement, SupplyCategory])],
  controllers: [SuppliesController],
  providers: [SuppliesService, SupplyCategoryService],
  exports: [SuppliesService],
})
export class SuppliesModule {}
