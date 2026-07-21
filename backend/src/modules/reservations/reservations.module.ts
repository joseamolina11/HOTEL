import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { Reservation } from './entities/reservation.entity';
import { ReservationGuest } from './entities/reservation-guest.entity';
import { Room } from '../rooms/entities/room.entity';
import { Guest } from '../guests/entities/guest.entity';
import { Payment } from '../payments/entities/payment.entity';
import { CashRegister } from '../cash-register/entities/cash-register.entity';
import { PaymentMethodsModule } from '../payment-methods/payment-methods.module';
import { ReciboCajaModule } from '../recibo-caja/recibo-caja.module';
import { FinancialMovementsModule } from '../financial-movements/financial-movements.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, ReservationGuest, Room, Guest, Payment, CashRegister]),
    PaymentMethodsModule,
    ReciboCajaModule,
    FinancialMovementsModule,
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
