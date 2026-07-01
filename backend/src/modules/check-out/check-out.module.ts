import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckOutController } from './check-out.controller';
import { CheckOutService } from './check-out.service';
import { CheckOut } from './entities/check-out.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Consumption } from '../consumptions/entities/consumption.entity';
import { Room } from '../rooms/entities/room.entity';
import { Order } from '../orders/entities/order.entity';
import { Payment } from '../payments/entities/payment.entity';
import { CashRegister } from '../cash-register/entities/cash-register.entity';
import { HotelConfig } from '../hotel-config/entities/hotel-config.entity';
import { PaymentMethodsModule } from '../payment-methods/payment-methods.module';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';
import { ReciboCajaModule } from '../recibo-caja/recibo-caja.module';
import { FinancialMovementsModule } from '../financial-movements/financial-movements.module';

@Module({
  imports: [TypeOrmModule.forFeature([CheckOut, Reservation, Consumption, Room, Order, Payment, CashRegister, HotelConfig, PaymentMethod]),PaymentMethodsModule,ReciboCajaModule,FinancialMovementsModule],
  controllers: [CheckOutController],
  providers: [CheckOutService],
  exports: [CheckOutService],
})
export class CheckOutModule {}
