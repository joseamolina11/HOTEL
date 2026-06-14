import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn,
} from 'typeorm';
import { SupplyMovement } from './supply-movement.entity';
import { SupplyCategory } from './supply-category.entity';

@Entity('supply_items')
export class SupplyItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ name: 'categoria_suministro' })
  categoriaSuministro: string;

  @Column({ name: 'category_id', nullable: true })
  categoryId: string;

  @ManyToOne(() => SupplyCategory, (cat) => cat.items)
  @JoinColumn({ name: 'category_id' })
  category: SupplyCategory;

  @Column({ name: 'unidad_medida', default: 'unidad' })
  unidadMedida: string;

  @Column({ name: 'stock_actual', default: 0 })
  stockActual: number;

  @Column({ name: 'stock_minimo', default: 0 })
  stockMinimo: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'costo_unitario', default: 0 })
  costoUnitario: number;

  @Column({ nullable: true })
  proveedor: string;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => SupplyMovement, (movement) => movement.supplyItem)
  movements: SupplyMovement[];
}
