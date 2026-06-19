import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tax_config')
export class TaxConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  tasa: number;

  @Column({ default: true })
  activo: boolean;

  @Column({ name: 'es_defecto', default: false })
  esDefecto: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
