import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { InventoryItem } from './inventory-item.entity';
import { User } from 'src/modules/auth/entities/user.entity';
import { Expense } from 'src/modules/expenses/entities/expense.entity';

@Entity('inventory_movements')
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'inventory_item_id' })
  inventoryItemId: string;

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

  @Column({ name: 'expense_id', nullable: true })
  expenseId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => InventoryItem, (item) => item.movements)
  @JoinColumn({ name: 'inventory_item_id' })
  inventoryItem: InventoryItem;

  @ManyToOne(() => User, (user) => user.inventoryMovements)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Expense, { nullable: true })
  @JoinColumn({ name: 'expense_id' })
  expense: Expense;
}
