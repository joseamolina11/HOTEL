import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Order } from 'src/modules/orders/entities/order.entity';
import { Room } from 'src/modules/rooms/entities/room.entity';
import { Reservation } from 'src/modules/reservations/entities/reservation.entity';
import { User } from 'src/modules/auth/entities/user.entity';
import { PaymentMethod } from 'src/modules/payment-methods/entities/payment-method.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', nullable: true })
  orderId: string;

  @Column({ name: 'reservation_id', nullable: true })
  reservationId: string;

  @Column({ name: 'room_id' })
  roomId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ name: 'metodo_pago_id', nullable: true })
  metodoPagoId: string;

  @ManyToOne(() => PaymentMethod)
  @JoinColumn({ name: 'metodo_pago_id' })
  metodoPago: PaymentMethod;

  @Column({ name: 'comprobante', nullable: true })
  comprobante: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  fecha: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => Reservation, { nullable: true })
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
