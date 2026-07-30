import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
  OneToMany, OneToOne,
} from 'typeorm';
import { User } from 'src/modules/auth/entities/user.entity';
import { Room } from 'src/modules/rooms/entities/room.entity';
import { Guest } from 'src/modules/guests/entities/guest.entity';
import { ReservationGuest } from './reservation-guest.entity';
import { CheckIn } from 'src/modules/check-in/entities/check-in.entity';
import { CheckOut } from 'src/modules/check-out/entities/check-out.entity';
import { Consumption } from 'src/modules/consumptions/entities/consumption.entity';
import { Order } from 'src/modules/orders/entities/order.entity';
import { ReciboCaja } from 'src/modules/recibo-caja/entities/recibo-caja.entity';
import { FileRecord } from 'src/modules/files/entities/file.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { Surcharge } from 'src/modules/surcharges/entities/surcharge.entity';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  codigo: string;

  @Column({ name: 'room_id' })
  roomId: string;

  @Column({ name: 'guest_id' })
  guestId: string;

  @Column({ name: 'fecha_entrada', type: 'timestamptz' })
  fechaEntrada: Date;

  @Column({ name: 'fecha_salida', type: 'timestamptz' })
  fechaSalida: Date;

  @Column({ name: 'cantidad_huespedes', default: 1 })
  cantidadHuespedes: number;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({
    type: 'varchar',
    default: 'pendiente',
  })
  estado: 'pendiente' | 'confirmada' | 'checkin' | 'checkout' | 'cancelada';

  @Column({ type: 'varchar', default: 'directo' })
  origen: 'directo' | 'booking' | 'airbnb';

  @Column({ type: 'text', nullable: true })
  direccion?: string;

  @Column({ type: 'varchar', nullable: true })
  ciudad?: string;

  @Column({ type: 'varchar', nullable: true })
  pais?: string;

  @Column({ type: 'varchar', nullable: true })
  oficio?: string;

  @Column({ type: 'varchar', nullable: true })
  empresa?: string;

  @Column({ type: 'varchar', nullable: true })
  telefonoContacto?: string;

  @Column({ type: 'varchar', nullable: true })
  emailContacto?: string;

  @Column({ type: 'varchar', nullable: true })
  transporteLlegada?: string;

  @Column({ type: 'varchar', nullable: true })
  transporteSalida?: string;

  @Column({ type: 'varchar', nullable: true })
  reservacionOrigen?: string;

  @Column({ type: 'varchar', nullable: true })
  procedencia?: string;

  @Column({ type: 'varchar', nullable: true })
  destino?: string;

  @Column({ type: 'varchar', nullable: true })
  motivoViaje?: string;

  @Column({ name: 'numero_placa', type: 'varchar', nullable: true })
  numeroPlaca?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  descuento: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'precio_base' })
  precioBase: number;

  @Column({ name: 'ota_reservation_id', nullable: true })
  otaReservationId: string;

  @Column({ name: 'contrato_file_id', nullable: true })
  contratoFileId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by_id', nullable: true })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @ManyToOne(() => Room, (room) => room.reservations)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => Guest, (guest) => guest.reservations)
  @JoinColumn({ name: 'guest_id' })
  guest: Guest;

  @OneToMany(() => ReservationGuest, (rg) => rg.reservation, { cascade: true })
  companions: ReservationGuest[];

  @OneToOne(() => CheckIn, (ci) => ci.reservation)
  checkIn: CheckIn;

  @OneToOne(() => CheckOut, (co) => co.reservation)
  checkOut: CheckOut;

  @OneToMany(() => Consumption, (consumption) => consumption.reservation)
  consumptions: Consumption[];

  @OneToMany(() => Order, (order) => order.reservation)
  orders: Order[];

  @OneToMany(() => ReciboCaja, (rc) => rc.reservation)
  recibosCaja: ReciboCaja[];

  @OneToMany(() => Payment, (p) => p.reservation)
  payments: Payment[];

  @OneToMany(() => Surcharge, (s) => s.reservation)
  surcharges: Surcharge[];

  @ManyToOne(() => FileRecord)
  @JoinColumn({ name: 'contrato_file_id' })
  contratoFile?: FileRecord;
}
