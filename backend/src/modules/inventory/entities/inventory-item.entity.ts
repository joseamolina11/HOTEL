import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn,
} from 'typeorm';
import { InventoryMovement } from './inventory-movement.entity';
import { InventoryCategory } from './inventory-category.entity';
import { Consumption } from 'src/modules/consumptions/entities/consumption.entity';

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column()
  categoria: string;

  @Column({ name: 'category_id', nullable: true })
  categoryId: string;

  @ManyToOne(() => InventoryCategory, (cat) => cat.items)
  @JoinColumn({ name: 'category_id' })
  category: InventoryCategory;

  @Column({ name: 'stock_actual', default: 0 })
  stockActual: number;

  @Column({ name: 'stock_minimo', default: 0 })
  stockMinimo: number;

  @Column({ name: 'costo_unitario', type: 'decimal', precision: 10, scale: 2, default: 0 })
  costoUnitario: number;

  @Column({ name: 'precio_venta', type: 'decimal', precision: 10, scale: 2, default: 0 })
  precioVenta: number;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => InventoryMovement, (movement) => movement.inventoryItem)
  movements: InventoryMovement[];

  @OneToMany(() => Consumption, (consumption) => consumption.inventoryItem)
  consumptions: Consumption[];
}
