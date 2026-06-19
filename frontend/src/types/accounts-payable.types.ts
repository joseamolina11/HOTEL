export interface PagoCuenta {
  id: string;
  cuentaId: string;
  monto: number;
  fechaPago: string;
  metodoPago: 'efectivo' | 'transferencia' | 'tarjeta' | 'otros';
  referencia?: string;
  userId?: string;
  createdAt: string;
}

export interface AccountsPayable {
  id: string;
  codigo: string;
  supplierId: string;
  supplier?: { id: string; razonSocial: string; nit: string };
  purchaseOrderId?: string;
  purchaseOrder?: { id: string; codigo: string };
  expenseId?: string;
  expense?: { id: string; codigo: string; concepto: string };
  fechaEmision: string;
  fechaVencimiento: string;
  montoOriginal: number;
  saldoPendiente: number;
  estado: 'pendiente' | 'parcialmente_pagada' | 'pagada' | 'vencida' | 'anulada';
  observaciones?: string;
  pagos?: PagoCuenta[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountsPayableDto {
  supplierId: string;
  purchaseOrderId?: string;
  expenseId?: string;
  fechaEmision: string;
  fechaVencimiento: string;
  montoOriginal: number;
  estado?: 'pendiente' | 'parcialmente_pagada' | 'pagada' | 'vencida' | 'anulada';
  observaciones?: string;
}

export interface UpdateAccountsPayableDto {
  supplierId?: string;
  purchaseOrderId?: string;
  expenseId?: string;
  fechaEmision?: string;
  fechaVencimiento?: string;
  montoOriginal?: number;
  estado?: 'pendiente' | 'parcialmente_pagada' | 'pagada' | 'vencida' | 'anulada';
  observaciones?: string;
}

export interface RegisterPagoDto {
  monto: number;
  fechaPago: string;
  metodoPago: 'efectivo' | 'transferencia' | 'tarjeta' | 'otros';
  referencia?: string;
}
