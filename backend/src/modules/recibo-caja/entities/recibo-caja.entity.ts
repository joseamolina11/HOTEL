import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { ReciboCajaPago } from './recibo-caja-pago.entity';
import { ReciboCajaItem } from './recibo-caja-item.entity';
import { Reservation } from 'src/modules/reservations/entities/reservation.entity';
import { User } from 'src/modules/auth/entities/user.entity';

@Entity('recibos_caja')
export class ReciboCaja {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  codigo: string;

  @Column({ name: 'cliente_nombre', nullable: true })
  clienteNombre: string;

  @Column({ name: 'reservation_id', nullable: true })
  reservationId: string;

  @ManyToOne(() => Reservation, { nullable: true })
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  descuento: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ name: 'created_by_id', nullable: true })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @OneToMany(() => ReciboCajaPago, (p) => p.recibo, { cascade: true })
  pagos: ReciboCajaPago[];

  @OneToMany(() => ReciboCajaItem, (i) => i.recibo, { cascade: true })
  items: ReciboCajaItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
