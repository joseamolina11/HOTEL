import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { PurchaseOrder } from 'src/modules/purchase-orders/entities/purchase-order.entity';
import { Expense } from 'src/modules/expenses/entities/expense.entity';
import { FileRecord } from '@/modules/files/entities/file.entity';

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  razonSocial: string;

  @Column({ unique: true })
  nit: string;

  @Column({ nullable: true })
  contacto: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  direccion: string;

  @Column({ default: true })
  activo: boolean;

  @Column({ name: 'rut_file_id', nullable: true })
  rutFileId: string;

  @Column({ name: 'rut_url', nullable: true })
  rutUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
  
  @ManyToOne(() => FileRecord)
  @JoinColumn({ name: 'rut_file_id' })
  rutFile: FileRecord;

  @OneToMany(() => PurchaseOrder, (po) => po.supplier)
  purchaseOrders: PurchaseOrder[];

  @OneToMany(() => Expense, (expense) => expense.supplier)
  expenses: Expense[];
}
