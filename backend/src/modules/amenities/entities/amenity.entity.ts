import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany } from 'typeorm';
import { RoomType } from 'src/modules/room-types/entities/room-type.entity';

@Entity('amenities')
export class Amenity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToMany(() => RoomType, (roomType) => roomType.amenities)
  roomTypes: RoomType[];
}
