import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HotelConfigController } from './hotel-config.controller';
import { HotelConfigService } from './hotel-config.service';
import { HotelConfig } from './entities/hotel-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HotelConfig])],
  controllers: [HotelConfigController],
  providers: [HotelConfigService],
  exports: [HotelConfigService],
})
export class HotelConfigModule {}
