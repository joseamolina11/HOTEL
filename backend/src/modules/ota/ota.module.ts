import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtaController } from './ota.controller';
import { OtaService } from './ota.service';
import { BookingAdapter } from './adapters/booking.adapter';
import { AirbnbAdapter } from './adapters/airbnb.adapter';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Room } from '../rooms/entities/room.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, Room])],
  controllers: [OtaController],
  providers: [OtaService, BookingAdapter, AirbnbAdapter],
  exports: [OtaService],
})
export class OtaModule {}
