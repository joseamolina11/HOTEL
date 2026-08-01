import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('mincit_envios')
export class MincitEnvio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'reservation_id' })
  reservationId: string;

  @Column({ type: 'jsonb', nullable: true })
  payload: any;

  @Column({ type: 'varchar', length: 20, default: 'pendiente' })
  estado: 'pendiente' | 'enviado' | 'fallido';

  @Column({ type: 'int', default: 0 })
  intentos: number;

  @Column({ name: 'proximo_intento', type: 'timestamptz', nullable: true })
  proximoIntento: Date | null;

  @Column({ name: 'ultimo_error', type: 'text', nullable: true })
  ultimoError: string | null;

  @Column({ name: 'codigo_respuesta', type: 'varchar', nullable: true })
  codigoRespuesta: string | null;

  @Column({ name: 'respuesta_raw', type: 'text', nullable: true })
  respuestaRaw: string | null;

  @Column({ name: 'enviado_at', type: 'timestamptz', nullable: true })
  enviadoAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
