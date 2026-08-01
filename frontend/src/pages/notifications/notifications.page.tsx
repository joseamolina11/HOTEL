import { useState } from 'react';
import { Bell, CalendarRange, ClipboardList, CheckCheck, Check, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNotificationList, useMarkAllNotificationsRead, useMarkNotificationRead, useDeleteNotification } from '@/hooks/useNotifications';
import { formatDateTime } from '@/lib/utils';
import { confirmAction } from '@/lib/notifications';

const PAGE_SIZE = 20;

type FilterTab = 'todas' | 'no-leidas';

export function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<FilterTab>('todas');

  const { data, isLoading } = useNotificationList({ page, limit: PAGE_SIZE });
  const readMut = useMarkNotificationRead();
  const markAllReadMut = useMarkAllNotificationsRead();
  const deleteMut = useDeleteNotification();

  const items = (data?.data ?? []).filter((n) => (tab === 'no-leidas' ? !n.leida : true));
  const totalPages = data?.totalPages ?? 1;
  const unreadInPage = (data?.data ?? []).filter((n) => !n.leida).length;

  const handleDelete = async (id: string) => {
    const res = await confirmAction('Eliminar notificación', '¿Eliminar esta notificación?');
    if (res.isConfirmed) deleteMut.mutate(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Bell className="h-6 w-6" /> Historial de Notificaciones
          </h1>
          <p className="text-sm text-muted-foreground">
            Eventos y bitácoras recientes. Marca como leídas las que ya revisaste.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={markAllReadMut.isPending || unreadInPage === 0}
          onClick={() => markAllReadMut.mutate()}
        >
          <CheckCheck className="mr-2 h-4 w-4" /> Marcar todas como leídas
        </Button>
      </div>

      <div className="flex gap-2">
        {(
          [
            { key: 'todas', label: 'Todas' },
            { key: 'no-leidas', label: 'No leídas' },
          ] as { key: FilterTab; label: string }[]
        ).map((t) => (
          <Button
            key={t.key}
            variant={tab === t.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setTab(t.key);
              setPage(1);
            }}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="px-4 py-8 text-center text-muted-foreground">Cargando...</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">Sin notificaciones</div>
          ) : (
            <div className="divide-y">
              {items.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 ${n.leida ? '' : 'bg-primary/5'}`}
                >
                  <span
                    className={`mt-0.5 shrink-0 rounded-lg p-2 ${
                      n.tipo === 'evento'
                        ? 'bg-indigo-500/10 text-indigo-500'
                        : 'bg-emerald-500/10 text-emerald-500'
                    }`}
                  >
                    {n.tipo === 'evento' ? (
                      <CalendarRange className="h-4 w-4" />
                    ) : (
                      <ClipboardList className="h-4 w-4" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{n.titulo}</span>
                      {!n.leida && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.mensaje}</p>
                    <span className="mt-1 block text-xs text-muted-foreground/70">
                      {formatDateTime(n.createdAt)}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {!n.leida && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Marcar como leída"
                        disabled={readMut.isPending}
                        onClick={() => readMut.mutate(n.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      title="Eliminar"
                      disabled={deleteMut.isPending}
                      onClick={() => handleDelete(n.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
          </Button>
          <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Siguiente <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
