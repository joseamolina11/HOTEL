import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarRange, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';

const GERENCIA_ROUTES = [
  { to: '/dashboard-gerencial', label: 'Dashboard Gerencial', icon: LayoutDashboard },
  { to: '/calendar-gerencial', label: 'Calendario Gerencial', icon: CalendarRange },
  { to: '/statistics/gerencial', label: 'Estadísticas Gerencial', icon: PieChart },
];

export function GerenciaNav() {
  const { pathname } = useLocation();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {GERENCIA_ROUTES.map(({ to, label, icon: Icon }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-4 transition-colors',
              active
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5',
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
