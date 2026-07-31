import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tercero } from 'src/modules/terceros/entities/tercero.entity';

@Entity('surcharge_types')
export class SurchargeType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  nombre: string;

  @Column({ name: 'tercero_id', nullable: true })
  terceroId?: string;

  @ManyToOne(() => Tercero, { nullable: true })
  @JoinColumn({ name: 'tercero_id' })
  tercero?: Tercero;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  montoDefault: number;

  @Column({ type: 'varchar', default: 'fijo' })
  tipo: 'fijo' | 'por_noche' | 'porcentaje';

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
