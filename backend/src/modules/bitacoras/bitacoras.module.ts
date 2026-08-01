import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bitacora } from './entities/bitacora.entity';
import { BitacorasController } from './bitacoras.controller';
import { BitacorasService } from './bitacoras.service';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Bitacora]), NotificationsModule],
  controllers: [BitacorasController],
  providers: [BitacorasService],
})
export class BitacorasModule {}
