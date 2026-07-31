import { Moon, Sun, Bell, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/useAuth';
import { useOpenCashRegister } from '@/hooks/useCashRegister';
import { formatCurrency } from '@/lib/utils';
import { confirmAction } from '@/lib/notifications';

export function Topbar() {
  const { theme, toggleTheme } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const logoutMut = useLogout();
  const { data: openRegister } = useOpenCashRegister();

  const handleLogout = async () => {
    const result = await confirmAction('Cerrar sesión', '¿Estás seguro de que deseas salir?');
    if (result.isConfirmed) {
      logoutMut.mutate();
    }
  };

  const balance = openRegister
    ? (Number(openRegister.montoInicial) || 0) +
      (Number(openRegister.totalEfectivo) || 0) +
      (Number(openRegister.totalTransferencia) || 0) +
      (Number(openRegister.totalTarjeta) || 0) +
      (Number(openRegister.totalOtros) || 0)
    : null;

  const balanceBreakdown = openRegister
    ? [
        `Efectivo: ${formatCurrency(openRegister.totalEfectivo)}`,
        `Transferencia: ${formatCurrency(openRegister.totalTransferencia)}`,
        `Tarjeta: ${formatCurrency(openRegister.totalTarjeta)}`,
        `Otros: ${formatCurrency(openRegister.totalOtros)}`,
        `Monto inicial: ${formatCurrency(openRegister.montoInicial)}`,
      ].join('\n')
    : '';

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-4 border-b bg-background px-6">
      {openRegister && (
        <div
          className="mr-auto flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-1 text-sm"
          title={balanceBreakdown}
        >
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="font-medium text-green-700">Caja: {formatCurrency(balance ?? 0)}</span>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{user?.nombres} {user?.apellidos}</span>
        <span className="rounded bg-secondary px-2 py-0.5 text-xs capitalize">{user?.role}</span>
      </div>

      <Button variant="ghost" size="icon" onClick={toggleTheme}>
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      <Button variant="ghost" size="icon">
        <Bell className="h-4 w-4" />
      </Button>

      <Button variant="ghost" size="icon" onClick={handleLogout} disabled={logoutMut.isPending}>
        {logoutMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      </Button>
    </header>
  );
}
