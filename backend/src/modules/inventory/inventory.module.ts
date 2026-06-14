import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryCategoryService } from './inventory-category.service';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { InventoryCategory } from './entities/inventory-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryItem, InventoryMovement, InventoryCategory])],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryCategoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
