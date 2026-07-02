import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckInController } from './check-in.controller';
import { CheckInService } from './check-in.service';
import { CheckIn } from './entities/check-in.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { ReservationGuest } from '../reservations/entities/reservation-guest.entity';
import { Room } from '../rooms/entities/room.entity';
import { Guest } from '../guests/entities/guest.entity';
import { Payment } from '../payments/entities/payment.entity';
import { CashRegister } from '../cash-register/entities/cash-register.entity';
import { HotelConfig } from '../hotel-config/entities/hotel-config.entity';
import { PaymentMethodsModule } from '../payment-methods/payment-methods.module';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';
import { ReciboCajaModule } from '../recibo-caja/recibo-caja.module';
import { FinancialMovementsModule } from '../financial-movements/financial-movements.module';

@Module({
  imports: [TypeOrmModule.forFeature([CheckIn, Reservation, ReservationGuest, Room, Guest, Payment, CashRegister, HotelConfig, PaymentMethod]),PaymentMethodsModule,ReciboCajaModule,FinancialMovementsModule],
  controllers: [CheckInController],
  providers: [CheckInService],
  exports: [CheckInService],
})
export class CheckInModule {}
