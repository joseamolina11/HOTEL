import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashRegisterController } from './cash-register.controller';
import { CashRegisterService } from './cash-register.service';
import { CashRegister } from './entities/cash-register.entity';
import { FinancialMovementsModule } from '../financial-movements/financial-movements.module';
import { FinancialAccountsModule } from '../financial-accounts/financial-accounts.module';
import { FinancialMovement } from '../financial-movements/entities/financial-movement.entity';
import { ReciboCajaPago } from '../recibo-caja/entities/recibo-caja-pago.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Expense } from '../expenses/entities/expense.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CashRegister, FinancialMovement, ReciboCajaPago, Payment, Expense]),FinancialMovementsModule, FinancialAccountsModule],
  controllers: [CashRegisterController],
  providers: [CashRegisterService],
  exports: [CashRegisterService],
})
export class CashRegisterModule {}
