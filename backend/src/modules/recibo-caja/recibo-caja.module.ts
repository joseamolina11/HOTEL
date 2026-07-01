import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReciboCajaController } from './recibo-caja.controller';
import { ReciboCajaService } from './recibo-caja.service';
import { ReciboCaja } from './entities/recibo-caja.entity';
import { ReciboCajaPago } from './entities/recibo-caja-pago.entity';
import { ReciboCajaItem } from './entities/recibo-caja-item.entity';
import { HotelConfigModule } from '../hotel-config/hotel-config.module';
import { HotelConfig } from '../hotel-config/entities/hotel-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReciboCaja, ReciboCajaPago, ReciboCajaItem, HotelConfig]),HotelConfigModule],
  controllers: [ReciboCajaController],
  providers: [ReciboCajaService],
  exports: [ReciboCajaService],
})
export class ReciboCajaModule {}
