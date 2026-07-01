import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { FinancialAccount } from 'src/modules/financial-accounts/entities/financial-account.entity';

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ name: 'financial_account_id', nullable: true })
  financialAccountId: string;

  @ManyToOne(() => FinancialAccount)
  @JoinColumn({ name: 'financial_account_id' })
  financialAccount: FinancialAccount;

  @Column({ type: 'varchar', default: 'otros' })
  tipo: 'efectivo' | 'transferencia' | 'tarjeta' | 'otros';

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
