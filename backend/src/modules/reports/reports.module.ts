import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Surcharge } from '../surcharges/entities/surcharge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Surcharge])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
