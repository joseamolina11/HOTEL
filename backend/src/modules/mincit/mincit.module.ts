import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MincitEnvio } from './entities/mincit-envio.entity';
import { MincitService } from './mincit.service';
import { MincitController } from './mincit.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MincitEnvio])],
  controllers: [MincitController],
  providers: [MincitService],
  exports: [MincitService],
})
export class MincitModule {}
