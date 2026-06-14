import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { CheckIn } from 'src/modules/check-in/entities/check-in.entity';
import { CheckOut } from 'src/modules/check-out/entities/check-out.entity';
import { InventoryMovement } from 'src/modules/inventory/entities/inventory-movement.entity';
import { Consumption } from 'src/modules/consumptions/entities/consumption.entity';
import { SupplyMovement } from 'src/modules/supplies/entities/supply-movement.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  nombres: string;

  @Column()
  apellidos: string;

  @Column({ type: 'varchar', default: 'reception' })
  role: 'admin' | 'reception';

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => CheckIn, (checkIn) => checkIn.user)
  checkIns: CheckIn[];

  @OneToMany(() => CheckOut, (checkOut) => checkOut.user)
  checkOuts: CheckOut[];

  @OneToMany(() => InventoryMovement, (movement) => movement.user)
  inventoryMovements: InventoryMovement[];

  @OneToMany(() => Consumption, (consumption) => consumption.user)
  consumptions: Consumption[];

  @OneToMany(() => SupplyMovement, (movement) => movement.user)
  supplyMovements: SupplyMovement[];
}
