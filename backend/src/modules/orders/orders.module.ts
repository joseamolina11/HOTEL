import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { Room } from '../rooms/entities/room.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { CashRegister } from '../cash-register/entities/cash-register.entity';
import { Payment } from '../payments/entities/payment.entity';
import { ReciboCajaModule } from '../recibo-caja/recibo-caja.module';
import { PaymentMethodsModule } from '../payment-methods/payment-methods.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, InventoryItem, InventoryMovement, Room, Reservation, CashRegister, Payment]),
    ReciboCajaModule,
    PaymentMethodsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
