export const ROLES = {
  ADMIN: 'admin',
  RECEPTION: 'reception',
} as const;

export const ROOM_STATUS = {
  DISPONIBLE: 'disponible',
  RESERVADA: 'reservada',
  OCUPADA: 'ocupada',
  LIMPIEZA: 'limpieza',
  MANTENIMIENTO: 'mantenimiento',
} as const;

export const RESERVATION_STATUS = {
  PENDIENTE: 'pendiente',
  CONFIRMADA: 'confirmada',
  CHECKIN: 'checkin',
  CHECKOUT: 'checkout',
  CANCELADA: 'cancelada',
} as const;

export const RESERVATION_ORIGIN = {
  DIRECTO: 'directo',
  BOOKING: 'booking',
  AIRBNB: 'airbnb',
} as const;

export const MOVEMENT_TYPE = {
  ENTRADA: 'entrada',
  SALIDA: 'salida',
  AJUSTE: 'ajuste',
} as const;

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  ROOM_NOT_AVAILABLE: 'ROOM_NOT_AVAILABLE',
  RESERVATION_OVERLAP: 'RESERVATION_OVERLAP',
  CAPACITY_EXCEEDED: 'CAPACITY_EXCEEDED',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
} as const;
