import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ReciboCaja } from './recibo-caja.entity';
import { PaymentMethod } from 'src/modules/payment-methods/entities/payment-method.entity';

@Entity('recibos_caja_pagos')
export class ReciboCajaPago {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recibo_id' })
  reciboId: string;

  @ManyToOne(() => ReciboCaja, (r) => r.pagos)
  @JoinColumn({ name: 'recibo_id' })
  recibo: ReciboCaja;

  @Column()
  concepto: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monto: number;

  @Column({ name: 'metodo_pago_id' })
  metodoPagoId: string;

  @ManyToOne(() => PaymentMethod)
  @JoinColumn({ name: 'metodo_pago_id' })
  metodoPago: PaymentMethod;

  @Column({ name: 'cuenta_id' })
  cuentaId: string;

  @Column({ name: 'referencia_tipo', nullable: true })
  referenciaTipo: string;

  @Column({ name: 'referencia_id', nullable: true })
  referenciaId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
