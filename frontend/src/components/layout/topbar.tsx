import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Bell, LogOut, Loader2, CheckCheck, History, CalendarRange, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/useAuth';
import { useOpenCashRegister } from '@/hooks/useCashRegister';
import { useUnreadCount, useNotificationList, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useNotifications';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { confirmAction } from '@/lib/notifications';

export function Topbar() {
  const { theme, toggleTheme } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const logoutMut = useLogout();
  const navigate = useNavigate();
  const { data: openRegister } = useOpenCashRegister();

  const [notifOpen, setNotifOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const { data: unread = 0 } = useUnreadCount();
  const { data: notifData } = useNotificationList({ page: 1, limit: 8 });
  const notifications = notifData?.data ?? [];
  const readMut = useMarkNotificationRead();
  const markAllReadMut = useMarkAllNotificationsRead();

  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  const handleLogout = async () => {
    const result = await confirmAction('Cerrar sesión', '¿Estás seguro de que deseas salir?');
    if (result.isConfirmed) {
      logoutMut.mutate();
    }
  };

  const handleOpenNotification = (id: string) => {
    if (readMut.isPending) return;
    const n = notifications.find((item) => item.id === id);
    if (n && !n.leida) readMut.mutate(id);
  };

  const isOpen = openRegister?.estado == 'abierta' 


  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-4 border-b bg-background px-6">
      {openRegister && (
        <div
          className="mr-auto flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-1 text-sm"
        >
          {
            isOpen ? (
              <>
              <span className="text-green-700">Caja abierta desde {formatDateTime(openRegister.fechaApertura)}</span>
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="font-medium text-green-700">Caja abierta</span>
              </>
            ) : (
              <span className="text-red-700">Caja cerrada</span>
            )
          }
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{user?.nombres} {user?.apellidos}</span>
        <span className="rounded bg-secondary px-2 py-0.5 text-xs capitalize">{user?.role}</span>
      </div>

      <Button variant="ghost" size="icon" onClick={toggleTheme}>
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      {/* Notificaciones */}
      <div className="relative" ref={bellRef}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setNotifOpen((v) => !v)}
          aria-label="Notificaciones"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Button>

        {notifOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <span className="text-sm font-semibold">Notificaciones</span>
              {unread > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  disabled={markAllReadMut.isPending}
                  onClick={() => markAllReadMut.mutate()}
                >
                  <CheckCheck className="mr-1 h-3.5 w-3.5" /> Marcar todas
                </Button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">Sin notificaciones</p>
              ) : (
                <div className="divide-y">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleOpenNotification(n.id)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent ${
                        n.leida ? 'opacity-70' : 'bg-primary/5'
                      }`}
                    >
                      <span
                        className={`mt-0.5 shrink-0 rounded-lg p-1.5 ${
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
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{n.titulo}</span>
                        <span className="block truncate text-xs text-muted-foreground">{n.mensaje}</span>
                        <span className="mt-0.5 block text-[11px] text-muted-foreground/70">
                          {formatDateTime(n.createdAt)}
                        </span>
                      </span>
                      {!n.leida && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center"
                onClick={() => {
                  setNotifOpen(false);
                  navigate('/notifications');
                }}
              >
                <History className="mr-1 h-4 w-4" /> Ver historial de notificaciones
              </Button>
            </div>
          </div>
        )}
      </div>

      <Button variant="ghost" size="icon" onClick={handleLogout} disabled={logoutMut.isPending}>
        {logoutMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      </Button>
    </header>
  );
}
