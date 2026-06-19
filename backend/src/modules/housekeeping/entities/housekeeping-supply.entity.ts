import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Room } from 'src/modules/rooms/entities/room.entity';
import { SupplyItem } from 'src/modules/supplies/entities/supply-item.entity';

@Entity('housekeeping_supplies')
export class HousekeepingSupply {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'room_id' })
  roomId: string;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'supply_item_id' })
  supplyItemId: string;

  @ManyToOne(() => SupplyItem)
  @JoinColumn({ name: 'supply_item_id' })
  supplyItem: SupplyItem;

  @Column()
  cantidad: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
