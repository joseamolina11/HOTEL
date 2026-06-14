import { v4 as uuidv4 } from 'uuid';

export function generateReservationCode(): string {
  const prefix = 'RES';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${result}`;
}

export function generateUUID(): string {
  return uuidv4();
}
