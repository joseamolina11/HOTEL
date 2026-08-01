import apiClient from './client';

export interface AppNotification {
  id: string;
  userId: string;
  tipo: 'evento' | 'bitacora';
  titulo: string;
  mensaje: string;
  entidadId: string | null;
  createdById: string | null;
  leida: boolean;
  leidaAt: string | null;
  createdAt: string;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
}

export interface PaginatedNotifications {
  data: AppNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const notificationsApi = {
  findAll: async (filters: NotificationFilters = {}): Promise<PaginatedNotifications> => {
    const { data } = await apiClient.get('/notifications', { params: filters });
    return data?.data ?? data;
  },

  unreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get('/notifications/unread-count');
    return data?.data ?? data;
  },

  markRead: async (id: string): Promise<AppNotification | null> => {
    const { data } = await apiClient.patch(`/notifications/${id}/read`);
    return data?.data ?? data;
  },

  markAllRead: async (): Promise<{ updated: number }> => {
    const { data } = await apiClient.patch('/notifications/read-all');
    return data?.data ?? data;
  },

  remove: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.delete(`/notifications/${id}`);
    return data?.data ?? data;
  },
};
