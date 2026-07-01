import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Supplier } from 'src/modules/suppliers/entities/supplier.entity';
import { ExpenseCategory } from 'src/modules/expense-categories/entities/expense-category.entity';
import { PurchaseOrder } from 'src/modules/purchase-orders/entities/purchase-order.entity';
import { FileRecord } from '@/modules/files/entities/file.entity';
import { AccountsPayable } from 'src/modules/accounts-payable/entities/accounts-payable.entity';
import { PaymentMethod } from 'src/modules/payment-methods/entities/payment-method.entity';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  codigo: string;

  @Column({ name: 'supplier_id', nullable: true })
  supplierId: string;

  @ManyToOne(() => Supplier, (s) => s.expenses, { nullable: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ name: 'category_id' })
  categoryId: string;

  @ManyToOne(() => ExpenseCategory, (c) => c.expenses)
  @JoinColumn({ name: 'category_id' })
  category: ExpenseCategory;

  @Column({ name: 'purchase_order_id', nullable: true })
  purchaseOrderId: string;

  @Column({ name: 'accounts_payable_id', nullable: true })
  accountsPayableId: string;

  @ManyToOne(() => AccountsPayable, (ap) => ap.payingExpenses, { nullable: true })
  @JoinColumn({ name: 'accounts_payable_id' })
  accountsPayable: AccountsPayable;

  @ManyToOne(() => PurchaseOrder, { nullable: true })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: PurchaseOrder;

  @Column({ type: 'date' })
  fecha: string;

  @Column()
  concepto: string;

  @Column({ name: 'metodo_pago_id', nullable: true })
  metodoPagoId: string;

  @ManyToOne(() => PaymentMethod)
  @JoinColumn({ name: 'metodo_pago_id' })
  metodoPago: PaymentMethod;

  @Column({ nullable: true })
  referencia: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monto: number;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ nullable: true })
  comprobante: string;

  @ManyToOne(() => FileRecord, { nullable: true })
  @JoinColumn({ name: 'comprobante' })
  comprobanteFile: FileRecord;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
