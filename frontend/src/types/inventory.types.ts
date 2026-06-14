export interface InventoryItem {
  id: string;
  nombre: string;
  categoria: string;
  categoryId?: string;
  category?: InventoryCategory;
  stockActual: number;
  stockMinimo: number;
  costoUnitario: number;
  precioVenta: number;
  activo: boolean;
}

export interface InventoryCategory {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface InventoryMovement {
  id: string;
  inventoryItemId: string;
  userId: string;
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  stockAnterior: number;
  stockPosterior: number;
  precioUnitario: number;
  observaciones?: string;
  createdAt: string;
}

export interface CreateMovementDto {
  inventoryItemId: string;
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  precioUnitario?: number;
  observaciones?: string;
}
