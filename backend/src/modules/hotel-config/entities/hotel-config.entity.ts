import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('hotel_config')
export class HotelConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ type: 'text' })
  direccion: string;

  @Column()
  ciudad: string;

  @Column()
  pais: string;

  @Column()
  telefono: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ default: 'MXN' })
  moneda: string;

  @Column({ name: 'check_in_time', default: '15:00' })
  checkInTime: string;

  @Column({ name: 'check_out_time', default: '12:00' })
  checkOutTime: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
