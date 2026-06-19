import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { SupplyItem } from './supply-item.entity';
import { User } from 'src/modules/auth/entities/user.entity';
import { Expense } from 'src/modules/expenses/entities/expense.entity';

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

  @Column({ name: 'expense_id', nullable: true })
  expenseId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => SupplyItem, (item) => item.movements)
  @JoinColumn({ name: 'supply_item_id' })
  supplyItem: SupplyItem;

  @ManyToOne(() => User, (user) => user.supplyMovements)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Expense, { nullable: true })
  @JoinColumn({ name: 'expense_id' })
  expense: Expense;
}
