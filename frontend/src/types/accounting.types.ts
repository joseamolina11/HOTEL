export interface ExpenseCategory {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseCategoryDto {
  nombre: string;
  descripcion?: string;
}

export interface Supplier {
  id: string;
  razonSocial: string;
  nit: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDto {
  razonSocial: string;
  nit: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

export interface PurchaseOrderItem {
  id: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  codigo: string;
  supplierId: string;
  supplier: Supplier;
  fecha: string;
  observaciones?: string;
  estado: 'borrador' | 'aprobada' | 'recibida' | 'anulada';
  subtotal: number;
  impuestos: number;
  total: number;
  items: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseOrderDto {
  supplierId: string;
  fecha: string;
  observaciones?: string;
  estado?: 'borrador' | 'aprobada';
  items: { descripcion: string; cantidad: number; precioUnitario: number }[];
}

export interface Expense {
  id: string;
  codigo: string;
  supplierId?: string;
  supplier?: Supplier;
  categoryId: string;
  category: ExpenseCategory;
  purchaseOrderId?: string;
  purchaseOrder?: PurchaseOrder;
  fecha: string;
  concepto: string;
  metodoPago: 'efectivo' | 'transferencia' | 'tarjeta' | 'otros';
  referencia?: string;
  monto: number;
  observaciones?: string;
  comprobante?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseDto {
  supplierId?: string;
  categoryId: string;
  fecha: string;
  concepto: string;
  metodoPago: 'efectivo' | 'transferencia' | 'tarjeta' | 'otros';
  referencia?: string;
  monto: number;
  observaciones?: string;
  comprobante?: string;
  purchaseOrderId?: string;
}
