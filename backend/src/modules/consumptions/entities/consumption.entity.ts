import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Reservation } from 'src/modules/reservations/entities/reservation.entity';
import { InventoryItem } from 'src/modules/inventory/entities/inventory-item.entity';
import { User } from 'src/modules/auth/entities/user.entity';

@Entity('consumptions')
export class Consumption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reservation_id' })
  reservationId: string;

  @Column({ name: 'inventory_item_id' })
  inventoryItemId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  cantidad: number;

  @Column({ name: 'precio_unitario', type: 'decimal', precision: 10, scale: 2 })
  precioUnitario: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'timestamptz' })
  fecha: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Reservation, (reservation) => reservation.consumptions)
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;

  @ManyToOne(() => InventoryItem, (item) => item.consumptions)
  @JoinColumn({ name: 'inventory_item_id' })
  inventoryItem: InventoryItem;

  @ManyToOne(() => User, (user) => user.consumptions)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
