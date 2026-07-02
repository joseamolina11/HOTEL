import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { Expense } from './entities/expense.entity';
import { FileRecord } from '@/modules/files/entities/file.entity';
import { CashRegister } from '../cash-register/entities/cash-register.entity';
import { FinancialMovementsModule } from '../financial-movements/financial-movements.module';
import { FinancialAccountsModule } from '../financial-accounts/financial-accounts.module';
import { AccountsPayableModule } from '../accounts-payable/accounts-payable.module';
import { PaymentMethodsModule } from '../payment-methods/payment-methods.module';

@Module({
  imports: [TypeOrmModule.forFeature([Expense, FileRecord, CashRegister]),FinancialMovementsModule,FinancialAccountsModule,AccountsPayableModule,PaymentMethodsModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
