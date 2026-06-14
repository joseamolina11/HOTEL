import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
  OneToMany, OneToOne,
} from 'typeorm';
import { Room } from 'src/modules/rooms/entities/room.entity';
import { Guest } from 'src/modules/guests/entities/guest.entity';
import { ReservationGuest } from './reservation-guest.entity';
import { CheckIn } from 'src/modules/check-in/entities/check-in.entity';
import { CheckOut } from 'src/modules/check-out/entities/check-out.entity';
import { Consumption } from 'src/modules/consumptions/entities/consumption.entity';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  codigo: string;

  @Column({ name: 'room_id' })
  roomId: string;

  @Column({ name: 'guest_id' })
  guestId: string;

  @Column({ name: 'fecha_entrada', type: 'timestamptz' })
  fechaEntrada: Date;

  @Column({ name: 'fecha_salida', type: 'timestamptz' })
  fechaSalida: Date;

  @Column({ name: 'cantidad_huespedes', default: 1 })
  cantidadHuespedes: number;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({
    type: 'varchar',
    default: 'pendiente',
  })
  estado: 'pendiente' | 'confirmada' | 'checkin' | 'checkout' | 'cancelada';

  @Column({ type: 'varchar', default: 'directo' })
  origen: 'directo' | 'booking' | 'airbnb';

  @Column({ name: 'ota_reservation_id', nullable: true })
  otaReservationId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Room, (room) => room.reservations)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => Guest, (guest) => guest.reservations)
  @JoinColumn({ name: 'guest_id' })
  guest: Guest;

  @OneToMany(() => ReservationGuest, (rg) => rg.reservation, { cascade: true })
  companions: ReservationGuest[];

  @OneToOne(() => CheckIn, (ci) => ci.reservation)
  checkIn: CheckIn;

  @OneToOne(() => CheckOut, (co) => co.reservation)
  checkOut: CheckOut;

  @OneToMany(() => Consumption, (consumption) => consumption.reservation)
  consumptions: Consumption[];
}
