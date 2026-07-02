import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Supplier } from 'src/modules/suppliers/entities/supplier.entity';
import { PurchaseOrder } from 'src/modules/purchase-orders/entities/purchase-order.entity';
import { Expense } from 'src/modules/expenses/entities/expense.entity';
import { PagoCuenta } from './pago-cuenta.entity';
import { User } from 'src/modules/auth/entities/user.entity';

@Entity('accounts_payable')
export class AccountsPayable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  codigo: string;

  @Column({ name: 'supplier_id' })
  supplierId: string;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ name: 'purchase_order_id', nullable: true })
  purchaseOrderId: string;

  @ManyToOne(() => PurchaseOrder, { nullable: true })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: PurchaseOrder;

  @Column({ name: 'expense_id', nullable: true })
  sourceExpenseId: string;

  @ManyToOne(() => Expense, { nullable: true })
  @JoinColumn({ name: 'expense_id' })
  sourceExpense: Expense;

  @OneToMany(() => Expense, (e) => e.accountsPayable)
  payingExpenses: Expense[];

  @Column({ name: 'fecha_emision', type: 'date' })
  fechaEmision: string;

  @Column({ name: 'fecha_vencimiento', type: 'date' })
  fechaVencimiento: string;

  @Column({ name: 'monto_original', type: 'decimal', precision: 12, scale: 2 })
  montoOriginal: number;

  @Column({ name: 'saldo_pendiente', type: 'decimal', precision: 12, scale: 2 })
  saldoPendiente: number;

  @Column({ default: 'pendiente' })
  estado: 'pendiente' | 'parcialmente_pagada' | 'pagada' | 'vencida' | 'anulada';

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ name: 'created_by_id', nullable: true })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @OneToMany(() => PagoCuenta, (pago) => pago.cuenta)
  pagos: PagoCuenta[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
