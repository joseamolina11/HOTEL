import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ReciboCaja } from './recibo-caja.entity';

@Entity('recibos_caja_items')
export class ReciboCajaItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recibo_id' })
  reciboId: string;

  @ManyToOne(() => ReciboCaja, (r) => r.items)
  @JoinColumn({ name: 'recibo_id' })
  recibo: ReciboCaja;

  @Column()
  concepto: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cantidad: number;

  @Column({ name: 'precio_unitario', type: 'decimal', precision: 12, scale: 2, default: 0 })
  precioUnitario: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'varchar', default: 'consumo' })
  tipo: 'habitacion' | 'consumo' | 'pedido' | 'otro';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
