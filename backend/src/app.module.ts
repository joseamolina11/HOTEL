import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { AuthModule } from './modules/auth/auth.module';
import { HotelConfigModule } from './modules/hotel-config/hotel-config.module';
import { RoomTypesModule } from './modules/room-types/room-types.module';
import { AmenitiesModule } from './modules/amenities/amenities.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { GuestsModule } from './modules/guests/guests.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { CheckInModule } from './modules/check-in/check-in.module';
import { CheckOutModule } from './modules/check-out/check-out.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ConsumptionsModule } from './modules/consumptions/consumptions.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { OtaModule } from './modules/ota/ota.module';
import { SuppliesModule } from './modules/supplies/supplies.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CashRegisterModule } from './modules/cash-register/cash-register.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register(jwtConfig),
    AuthModule,
    HotelConfigModule,
    RoomTypesModule,
    AmenitiesModule,
    RoomsModule,
    GuestsModule,
    ReservationsModule,
    CheckInModule,
    CheckOutModule,
    InventoryModule,
    SuppliesModule,
    OrdersModule,
    PaymentsModule,
    CashRegisterModule,
    ConsumptionsModule,
    DashboardModule,
    OtaModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
