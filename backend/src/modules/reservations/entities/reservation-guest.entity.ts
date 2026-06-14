import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Reservation } from './reservation.entity';

@Entity('reservation_guests')
export class ReservationGuest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reservation_id' })
  reservationId: string;

  @Column()
  nombres: string;

  @Column()
  apellidos: string;

  @Column()
  documento: string;

  @Column()
  nacionalidad: string;

  @Column({ nullable: true })
  telefono?: string;

  @Column({ nullable: true })
  email?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Reservation, (reservation) => reservation.companions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;
}
