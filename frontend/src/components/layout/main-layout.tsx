import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { useUIStore } from '@/stores/ui.store';
import { cn } from '@/lib/utils';

export function MainLayout() {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main
        className={cn(
          'flex flex-1 flex-col transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-16',
        )}
      >
        <Topbar />

        <div className="flex-1 overflow-y-auto">
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
    </div>
  );
}