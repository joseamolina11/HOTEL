import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable,
} from 'typeorm';
import { Room } from 'src/modules/rooms/entities/room.entity';
import { Amenity } from 'src/modules/amenities/entities/amenity.entity';

@Entity('room_types')
export class RoomType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ name: 'capacidad_adultos', default: 1 })
  capacidadAdultos: number;

  @Column({ name: 'capacidad_ninos', default: 0 })
  capacidadNinos: number;

  @Column({ name: 'precio_base', type: 'decimal', precision: 10, scale: 2, default: 0 })
  precioBase: number;

  @Column({ name: 'color_identificador', default: '#3B82F6' })
  colorIdentificador: string;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Room, (room) => room.roomType)
  rooms: Room[];

  @ManyToMany(() => Amenity, (amenity) => amenity.roomTypes)
  @JoinTable({
    name: 'room_type_amenities',
    joinColumn: { name: 'room_type_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'amenity_id', referencedColumnName: 'id' },
  })
  amenities: Amenity[];
}
