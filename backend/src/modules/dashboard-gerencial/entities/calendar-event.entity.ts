import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('calendar_events')
export class CalendarEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'varchar', nullable: true })
  horaInicio?: string;

  @Column({ type: 'varchar', nullable: true })
  horaFin?: string;

  @Column({ type: 'varchar', default: 'evento' })
  tipo: 'evento' | 'mantenimiento' | 'feriado' | 'otro';

  @Column({ type: 'varchar', nullable: true })
  color?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
