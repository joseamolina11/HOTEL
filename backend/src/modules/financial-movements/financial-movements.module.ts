import { Module, forwardRef, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialMovementsController } from './financial-movements.controller';
import { FinancialMovementsService } from './financial-movements.service';
import { FinancialMovement } from './entities/financial-movement.entity';
import { FinancialAccountsModule } from '../financial-accounts/financial-accounts.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([FinancialMovement]),
    forwardRef(() => FinancialAccountsModule),
  ],
  controllers: [FinancialMovementsController],
  providers: [FinancialMovementsService],
  exports: [FinancialMovementsService],
})
export class FinancialMovementsModule {}
