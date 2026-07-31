import { v4 as uuidv4 } from 'uuid';
import { Repository } from 'typeorm';
import { Reservation } from 'src/modules/reservations/entities/reservation.entity';

export function sequentialCode(number: number, prefix: string): string {
  return `${prefix}-${String(number).padStart(12, '0')}`;
}

export async function getMaxSequence(
  repo: Repository<Reservation>,
  column: 'codigo' | 'checkin_consecutivo',
  prefix: string,
): Promise<number> {
  const [row] = await repo.query(
    `SELECT COALESCE(MAX(seq), 0) AS max_seq FROM (
       SELECT CAST(SUBSTRING(${column} FROM '[0-9]+$') AS INTEGER) AS seq
       FROM reservations WHERE ${column} IS NOT NULL AND ${column} ~ $1
     ) t`,
    [`^${prefix}-[0-9]+$`],
  );
  return Number(row?.max_seq || 0);
}

export function generateUUID(): string {
  return uuidv4();
}
