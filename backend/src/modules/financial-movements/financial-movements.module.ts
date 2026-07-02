import { Module, forwardRef, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialMovementsController } from './financial-movements.controller';
import { FinancialMovementsService } from './financial-movements.service';
import { FinancialMovement } from './entities/financial-movement.entity';
import { FinancialAccountsModule } from '../financial-accounts/financial-accounts.module';
import { CashRegister } from '../cash-register/entities/cash-register.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([FinancialMovement, CashRegister]),
    forwardRef(() => FinancialAccountsModule),
  ],
  controllers: [FinancialMovementsController],
  providers: [FinancialMovementsService],
  exports: [FinancialMovementsService],
})
export class FinancialMovementsModule {}
