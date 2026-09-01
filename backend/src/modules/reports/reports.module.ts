import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Surcharge } from '../surcharges/entities/surcharge.entity';
import { CashRegister } from '../cash-register/entities/cash-register.entity';
import { CashRegisterModule } from '../cash-register/cash-register.module';
import { FinancialMovement } from '../financial-movements/entities/financial-movement.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';
import { Room } from '../rooms/entities/room.entity';
import { Order } from '../orders/entities/order.entity';
import { Consumption } from '../consumptions/entities/consumption.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Surcharge, CashRegister, FinancialMovement,Payment, Expense,PaymentMethod, Room, Order,Consumption]), CashRegisterModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
