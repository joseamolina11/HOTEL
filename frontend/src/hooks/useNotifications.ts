import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, NotificationFilters } from '@/api/notifications.api';
import { toastSuccess } from '@/lib/notifications';

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['notifications'] });
};

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 60 * 1000,
  });
}

export function useNotificationList(filters: NotificationFilters = {}) {
  return useQuery({
    queryKey: ['notifications', 'list', filters],
    queryFn: () => notificationsApi.findAll(filters),
    placeholderData: (prev) => prev,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      toastSuccess('Notificaciones marcadas como leídas');
      invalidateAll(qc);
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.remove(id),
    onSuccess: () => invalidateAll(qc),
  });
}
