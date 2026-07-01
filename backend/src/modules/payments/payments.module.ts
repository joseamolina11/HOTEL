import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { FinancialMovementsModule } from '../financial-movements/financial-movements.module';
import { FinancialAccountsModule } from '../financial-accounts/financial-accounts.module';
import { PaymentMethodsModule } from '../payment-methods/payment-methods.module';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Order, Reservation, PaymentMethod]),FinancialMovementsModule,FinancialAccountsModule,PaymentMethodsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
