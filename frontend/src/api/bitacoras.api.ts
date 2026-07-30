import apiClient from './client';

export interface Bitacora {
  id: string;
  contenido: string;
  createdById: string;
  createdAt: string;
  createdBy?: { id: string; nombres: string; apellidos: string; email: string };
}

export interface BitacoraFilters {
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const bitacorasApi = {
  create: async (contenido: string) => {
    const { data } = await apiClient.post('/bitacoras', { contenido });
    return data?.data ?? data;
  },

  findAll: async (filters: BitacoraFilters = {}): Promise<PaginatedResult<Bitacora>> => {
    const { data } = await apiClient.get('/bitacoras', { params: filters });
    return data?.data ?? data;
  },
};
