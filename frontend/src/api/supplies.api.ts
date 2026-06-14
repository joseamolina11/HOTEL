import apiClient from './client';

export interface SupplyCategory {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface SupplyItem {
  id: string;
  nombre: string;
  descripcion?: string;
  categoriaSuministro: string;
  categoryId?: string;
  category?: SupplyCategory;
  unidadMedida: string;
  stockActual: number;
  stockMinimo: number;
  costoUnitario: number;
  proveedor?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplyMovement {
  id: string;
  supplyItemId: string;
  userId: string;
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  stockAnterior: number;
  stockPosterior: number;
  precioUnitario: number;
  observaciones?: string;
  createdAt: string;
  supplyItem?: SupplyItem;
  user?: { nombres: string; apellidos: string };
}

export interface CreateSupplyMovementDto {
  supplyItemId: string;
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  precioUnitario?: number;
  observaciones?: string;
}

export const suppliesApi = {
  findAll: async (params?: Record<string, string>) => {
    const { data } = await apiClient.get('/supplies', { params });
    return data;
  },

  findLowStock: async (): Promise<SupplyItem[]> => {
    const { data } = await apiClient.get('/supplies/low-stock');
    return data.data;
  },

  findCategories: async (): Promise<SupplyCategory[]> => {
    const { data } = await apiClient.get('/supplies/categories');
    return data.data?.data || [];
  },

  findOne: async (id: string): Promise<SupplyItem> => {
    const { data } = await apiClient.get(`/supplies/${id}`);
    return data.data;
  },

  findMovements: async (id: string): Promise<SupplyMovement[]> => {
    const { data } = await apiClient.get(`/supplies/${id}/movements`);
    return data.data;
  },

  findAllMovements: async (params?: Record<string, string>) => {
    const { data } = await apiClient.get('/supplies/movements', { params });
    return data;
  },

  create: async (dto: Partial<SupplyItem>): Promise<SupplyItem> => {
    const { data } = await apiClient.post('/supplies', dto);
    return data.data;
  },

  update: async (id: string, dto: Partial<SupplyItem>): Promise<SupplyItem> => {
    const { data } = await apiClient.put(`/supplies/${id}`, dto);
    return data.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/supplies/${id}`);
  },

  createMovement: async (dto: CreateSupplyMovementDto) => {
    const { data } = await apiClient.post('/supplies/movements', dto);
    return data.data;
  },

  createCategory: async (nombre: string, descripcion?: string): Promise<SupplyCategory> => {
    const { data } = await apiClient.post('/supplies/categories', { nombre, descripcion });
    return data.data;
  },

  updateCategory: async (id: string, dto: Partial<SupplyCategory>): Promise<SupplyCategory> => {
    const { data } = await apiClient.put(`/supplies/categories/${id}`, dto);
    return data.data;
  },

  removeCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/supplies/categories/${id}`);
  },
};
