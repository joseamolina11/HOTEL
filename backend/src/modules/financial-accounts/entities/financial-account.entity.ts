import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('financial_accounts')
export class FinancialAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({
    type: 'varchar',
    comment: 'caja_principal, caja_menor, banco, billetera_digital',
  })
  tipo: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  saldo: number;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
