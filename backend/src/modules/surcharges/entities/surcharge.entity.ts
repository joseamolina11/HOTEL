import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Reservation } from 'src/modules/reservations/entities/reservation.entity';
import { SurchargeType } from './surcharge-type.entity';
import { User } from 'src/modules/auth/entities/user.entity';

@Entity('surcharges')
export class Surcharge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reservation_id' })
  reservationId: string;

  @Column({ name: 'surcharge_type_id', nullable: true })
  surchargeTypeId?: string;

  @Column({ type: 'varchar' })
  descripcion: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ type: 'int', default: 1 })
  cantidad: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'timestamptz' })
  fecha: Date;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @Column({ type: 'varchar', default: 'pendiente' })
  estado: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Reservation)
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;

  @ManyToOne(() => SurchargeType, { nullable: true })
  @JoinColumn({ name: 'surcharge_type_id' })
  surchargeType?: SurchargeType;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
