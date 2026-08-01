import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardGerencialController } from './dashboard-gerencial.controller';
import { DashboardGerencialService } from './dashboard-gerencial.service';
import { Room } from 'src/modules/rooms/entities/room.entity';
import { Reservation } from 'src/modules/reservations/entities/reservation.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { CalendarEvent } from './entities/calendar-event.entity';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Room, Reservation, Payment, CalendarEvent]), NotificationsModule],
  controllers: [DashboardGerencialController],
  providers: [DashboardGerencialService],
})
export class DashboardGerencialModule {}
