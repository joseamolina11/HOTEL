import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { Room } from 'src/modules/rooms/entities/room.entity';
import { Guest } from 'src/modules/guests/entities/guest.entity';
import { Reservation } from 'src/modules/reservations/entities/reservation.entity';
import { User } from 'src/modules/auth/entities/user.entity';
import { OrderItem } from './order-item.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'room_id' })
  roomId: string;

  @Column({ name: 'reservation_id', nullable: true })
  reservationId: string;

  @Column({ name: 'guest_id', nullable: true })
  guestId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'codigo', unique: true })
  codigo: string;

  @Column({ type: 'timestamptz' })
  fecha: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'varchar', default: 'pendiente' })
  estado: 'pendiente' | 'pagado' | 'cancelado';

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => Reservation, { nullable: true })
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;

  @ManyToOne(() => Guest)
  @JoinColumn({ name: 'guest_id' })
  guest: Guest;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];
}
