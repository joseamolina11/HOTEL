import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from 'src/modules/auth/entities/user.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 50 })
  tipo: 'evento' | 'bitacora';

  @Column({ type: 'varchar', length: 200 })
  titulo: string;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ name: 'entidad_id', type: 'varchar', nullable: true })
  entidadId?: string | null;

  @Column({ name: 'created_by_id', type: 'varchar', nullable: true })
  createdById?: string | null;

  @Column({ type: 'boolean', default: false })
  leida: boolean;

  @Column({ name: 'leida_at', type: 'timestamptz', nullable: true })
  leidaAt?: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
