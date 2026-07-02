import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  module: string;

  @Column()
  action: string;

  @Column()
  nombre: string;

  @Column({ name: 'modulo_nombre', nullable: true })
  moduloNombre: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
