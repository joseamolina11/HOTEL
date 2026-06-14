import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { RoomType } from 'src/modules/room-types/entities/room-type.entity';
import { Reservation } from 'src/modules/reservations/entities/reservation.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  numero: string;

  @Column()
  nombre: string;

  @Column({ name: 'room_type_id' })
  roomTypeId: string;

  @Column({ default: 1 })
  piso: number;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({
    type: 'varchar',
    default: 'disponible',
  })
  estado: 'disponible' | 'reservada' | 'ocupada' | 'limpieza' | 'mantenimiento';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => RoomType, (roomType) => roomType.rooms)
  @JoinColumn({ name: 'room_type_id' })
  roomType: RoomType;

  @OneToMany(() => Reservation, (reservation) => reservation.room)
  reservations: Reservation[];
}
