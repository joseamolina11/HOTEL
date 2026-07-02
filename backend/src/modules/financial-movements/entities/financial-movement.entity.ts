import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { FinancialAccount } from 'src/modules/financial-accounts/entities/financial-account.entity';
import { User } from 'src/modules/auth/entities/user.entity';
import { ReciboCaja } from 'src/modules/recibo-caja/entities/recibo-caja.entity';

@Entity('financial_movements')
export class FinancialMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'account_id' })
  accountId: string;

  @ManyToOne(() => FinancialAccount)
  @JoinColumn({ name: 'account_id' })
  account: FinancialAccount;

  @Column({
    type: 'varchar',
    comment: 'INGRESO, EGRESO, TRANSFERENCIA_ENTRADA, TRANSFERENCIA_SALIDA, AJUSTE, APERTURA_CAJA, CIERRE_CAJA',
  })
  tipo: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monto: number;

  @Column({ name: 'saldo_anterior', type: 'decimal', precision: 12, scale: 2 })
  saldoAnterior: number;

  @Column({ name: 'saldo_posterior', type: 'decimal', precision: 12, scale: 2 })
  saldoPosterior: number;

  @Column({ type: 'text', nullable: true })
  concepto: string;

  @Column({ type: 'varchar', nullable: true, comment: 'payment, expense, accounts_payable, cash_register, transfer, adjustment' })
  referenciaTipo: string;

  @Column({ nullable: true, comment: 'ID del registro origen (payment_id, expense_id, etc)' })
  referenciaId: string;

  @Column({ name: 'recibo_id', nullable: true })
  reciboId: string;

  @ManyToOne(() => ReciboCaja, { nullable: true })
  @JoinColumn({ name: 'recibo_id' })
  reciboCaja: ReciboCaja;

  @Column({ name: 'cash_register_id', nullable: true })
  cashRegisterId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string | null;

  @Column({ name: 'fecha_movimiento', type: 'timestamptz', default: () => 'NOW()' })
  fechaMovimiento: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
