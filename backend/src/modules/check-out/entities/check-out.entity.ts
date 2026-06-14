import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn, OneToOne,
} from 'typeorm';
import { Reservation } from 'src/modules/reservations/entities/reservation.entity';
import { User } from 'src/modules/auth/entities/user.entity';

@Entity('check_outs')
export class CheckOut {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reservation_id', unique: true })
  reservationId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'fecha_hora', type: 'timestamptz' })
  fechaHora: Date;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ name: 'consumos_total', type: 'decimal', precision: 10, scale: 2, default: 0 })
  consumosTotal: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToOne(() => Reservation, (reservation) => reservation.checkOut)
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;

  @ManyToOne(() => User, (user) => user.checkOuts)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
