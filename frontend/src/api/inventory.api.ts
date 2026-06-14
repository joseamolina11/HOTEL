import apiClient from './client';
import { InventoryItem, InventoryCategory, CreateMovementDto } from '@/types/inventory.types';

export const inventoryApi = {
  findAll: async (params?: Record<string, string>) => {
    const { data } = await apiClient.get('/inventory', { params });
    return data;
  },

  findLowStock: async (): Promise<InventoryItem[]> => {
    const { data } = await apiClient.get('/inventory/low-stock');
    return data.data;
  },

  findCategories: async (): Promise<InventoryCategory[]> => {
    const { data } = await apiClient.get('/inventory/categories');
    return data.data?.data || [];
  },

  findOne: async (id: string): Promise<InventoryItem> => {
    const { data } = await apiClient.get(`/inventory/${id}`);
    return data.data;
  },

  findMovements: async (id: string) => {
    const { data } = await apiClient.get(`/inventory/${id}/movements`);
    return data.data;
  },

  findAllMovements: async (params?: Record<string, string>) => {
    const { data } = await apiClient.get('/inventory/movements', { params });
    return data;
  },

  create: async (dto: Partial<InventoryItem>): Promise<InventoryItem> => {
    const { data } = await apiClient.post('/inventory', dto);
    return data.data;
  },

  update: async (id: string, dto: Partial<InventoryItem>): Promise<InventoryItem> => {
    const { data } = await apiClient.put(`/inventory/${id}`, dto);
    return data.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/inventory/${id}`);
  },

  createMovement: async (dto: CreateMovementDto) => {
    const { data } = await apiClient.post('/inventory/movements', dto);
    return data.data;
  },

  createCategory: async (nombre: string, descripcion?: string): Promise<InventoryCategory> => {
    const { data } = await apiClient.post('/inventory/categories', { nombre, descripcion });
    return data.data;
  },

  updateCategory: async (id: string, dto: Partial<InventoryCategory>): Promise<InventoryCategory> => {
    const { data } = await apiClient.put(`/inventory/categories/${id}`, dto);
    return data.data;
  },

  removeCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/inventory/categories/${id}`);
  },
};
