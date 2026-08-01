import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { useOpenCashRegister } from '@/hooks/useCashRegister';
import { OpenCashRegisterDialog } from '@/components/dialogs/open-cash-register-dialog';
import { cn } from '@/lib/utils';

export function MainLayout() {
  const { sidebarOpen } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const isGerencia = user?.role === 'gerencia';
  const { data: openRegister, isLoading } = useOpenCashRegister();

  return (
    <>
      {!isGerencia && <Sidebar />}
      <main className={cn(
        'flex flex-col min-h-screen transition-all duration-300',
        isGerencia ? '' : sidebarOpen ? 'ml-64' : 'ml-16',
      )}>
        <Topbar />
        <div className="flex-1">
          <div className="p-6">
            <Outlet />
          </div>
        </div>
        <footer className="border-t border-border/50 bg-background/80 px-6 py-2 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              © {new Date().getFullYear()} Hotel Luxury VIP
            </span>
            <div className="flex items-center gap-4">
              <span>v1.0.0</span>
              <span>Desarrollado por Andres Molina</span>
            </div>
          </div>
        </footer>
      </main>
      {!isGerencia && (
        <OpenCashRegisterDialog
          open={!isLoading && !openRegister}
          onClose={() => {}}
          dismissible={false}
        />
      )}
    </>
  );
}
