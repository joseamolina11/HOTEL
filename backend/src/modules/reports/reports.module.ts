import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Surcharge } from '../surcharges/entities/surcharge.entity';
import { CashRegister } from '../cash-register/entities/cash-register.entity';
import { CashRegisterModule } from '../cash-register/cash-register.module';

@Module({
  imports: [TypeOrmModule.forFeature([Surcharge, CashRegister]), CashRegisterModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
