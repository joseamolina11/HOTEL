import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { SupplyItem } from './supply-item.entity';
import { User } from 'src/modules/auth/entities/user.entity';

@Entity('supply_movements')
export class SupplyMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'supply_item_id' })
  supplyItemId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar' })
  tipo: 'entrada' | 'salida' | 'ajuste';

  @Column()
  cantidad: number;

  @Column({ name: 'stock_anterior' })
  stockAnterior: number;

  @Column({ name: 'stock_posterior' })
  stockPosterior: number;

  @Column({ name: 'precio_unitario', type: 'decimal', precision: 10, scale: 2, default: 0 })
  precioUnitario: number;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => SupplyItem, (item) => item.movements)
  @JoinColumn({ name: 'supply_item_id' })
  supplyItem: SupplyItem;

  @ManyToOne(() => User, (user) => user.supplyMovements)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
