import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from 'src/modules/auth/entities/user.entity';
import { FinancialAccount } from 'src/modules/financial-accounts/entities/financial-account.entity';

@Entity('cash_registers')
export class CashRegister {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'account_id', nullable: true })
  accountId: string;

  @ManyToOne(() => FinancialAccount)
  @JoinColumn({ name: 'account_id' })
  account: FinancialAccount;

  @Column({ name: 'fecha_apertura', type: 'timestamptz' })
  fechaApertura: Date;

  @Column({ name: 'fecha_cierre', type: 'timestamptz', nullable: true })
  fechaCierre: Date;

  @Column({ name: 'monto_inicial', type: 'decimal', precision: 10, scale: 2, default: 0 })
  montoInicial: number;

  @Column({ name: 'total_ventas', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalVentas: number;

  @Column({ name: 'total_efectivo', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalEfectivo: number;

  @Column({ name: 'total_transferencia', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalTransferencia: number;

  @Column({ name: 'total_tarjeta', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalTarjeta: number;

  @Column({ name: 'total_otros', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalOtros: number;

  @Column({ name: 'cantidad_transacciones', default: 0 })
  cantidadTransacciones: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  diferencia: number;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'varchar', default: 'abierta' })
  estado: 'abierta' | 'cerrada';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
