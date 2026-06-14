import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckInController } from './check-in.controller';
import { CheckInService } from './check-in.service';
import { CheckIn } from './entities/check-in.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { ReservationGuest } from '../reservations/entities/reservation-guest.entity';
import { Room } from '../rooms/entities/room.entity';
import { Guest } from '../guests/entities/guest.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CheckIn, Reservation, ReservationGuest, Room, Guest])],
  controllers: [CheckInController],
  providers: [CheckInService],
  exports: [CheckInService],
})
export class CheckInModule {}
