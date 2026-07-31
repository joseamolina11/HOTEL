import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Surcharge } from '../surcharges/entities/surcharge.entity';
import { RecordControlController } from './record-control.controller';
import { RecordControlService } from './record-control.service';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, Surcharge])],
  controllers: [RecordControlController],
  providers: [RecordControlService],
})
export class RecordControlModule {}
