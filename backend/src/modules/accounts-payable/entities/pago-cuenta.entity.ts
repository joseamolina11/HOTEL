import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AccountsPayable } from './accounts-payable.entity';

@Entity('pagos_cuenta')
export class PagoCuenta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cuenta_id' })
  cuentaId: string;

  @ManyToOne(() => AccountsPayable, (a) => a.pagos)
  @JoinColumn({ name: 'cuenta_id' })
  cuenta: AccountsPayable;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monto: number;

  @Column({ name: 'fecha_pago', type: 'date' })
  fechaPago: string;

  @Column({ name: 'metodo_pago' })
  metodoPago: 'efectivo' | 'transferencia' | 'tarjeta' | 'otros';

  @Column({ nullable: true })
  referencia: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
