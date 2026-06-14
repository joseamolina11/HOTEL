import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn, OneToOne,
} from 'typeorm';
import { Reservation } from '../../reservations/entities/reservation.entity';
import { User } from '../../auth/entities/user.entity';
@Entity('check_ins')
export class CheckIn {
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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToOne(() => Reservation, (reservation) => reservation.checkIn)
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;

  @ManyToOne(() => User, (user) => user.checkIns)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
