import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurchargeTypesController } from './surcharge-types.controller';
import { SurchargeTypesService } from './surcharge-types.service';
import { SurchargesController } from './surcharges.controller';
import { SurchargesService } from './surcharges.service';
import { SurchargeType } from './entities/surcharge-type.entity';
import { Surcharge } from './entities/surcharge.entity';
import { Reservation } from '../reservations/entities/reservation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SurchargeType, Surcharge, Reservation])],
  controllers: [SurchargeTypesController, SurchargesController],
  providers: [SurchargeTypesService, SurchargesService],
  exports: [SurchargesService],
})
export class SurchargesModule {}
