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

@Module({
  imports: [TypeOrmModule.forFeature([CheckOut, Reservation, Consumption, Room, Order, Payment, CashRegister, HotelConfig])],
  controllers: [CheckOutController],
  providers: [CheckOutService],
  exports: [CheckOutService],
})
export class CheckOutModule {}
