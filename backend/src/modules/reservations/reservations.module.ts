import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { Reservation } from './entities/reservation.entity';
import { ReservationGuest } from './entities/reservation-guest.entity';
import { Room } from '../rooms/entities/room.entity';
import { Guest } from '../guests/entities/guest.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, ReservationGuest, Room, Guest])],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
