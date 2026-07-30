import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bitacora } from './entities/bitacora.entity';
import { BitacorasController } from './bitacoras.controller';
import { BitacorasService } from './bitacoras.service';

@Module({
  imports: [TypeOrmModule.forFeature([Bitacora])],
  controllers: [BitacorasController],
  providers: [BitacorasService],
})
export class BitacorasModule {}
