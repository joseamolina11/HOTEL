import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboard.api';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BedDouble, Users, LogIn, LogOut, CalendarCheck, Package,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts';

export function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
    refetchInterval: 30000,
  });

  const { data: revenue } = useQuery({
    queryKey: ['dashboard-revenue'],
    queryFn: () => dashboardApi.getRevenue(),
  });

  const { data: reservationsByMonth } = useQuery({
    queryKey: ['dashboard-reservations-month'],
    queryFn: () => dashboardApi.getReservationsByMonth(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="h-24 animate-pulse bg-muted rounded-xl" /></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Operativo</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Disponibles"
          value={stats?.roomsByStatus.disponibles ?? 0}
          icon={BedDouble}
          description={`de ${stats?.totalRooms ?? 0} habitaciones`}
        />
        <StatCard
          title="Ocupadas"
          value={stats?.roomsByStatus.ocupadas ?? 0}
          icon={BedDouble}
        />
        <StatCard
          title="Limpieza"
          value={stats?.roomsByStatus.limpieza ?? 0}
          icon={BedDouble}
        />
        <StatCard
          title="Mantenimiento"
          value={stats?.roomsByStatus.mantenimiento ?? 0}
          icon={BedDouble}
        />
        <StatCard
          title="Llegadas Hoy"
          value={stats?.today.arrivals ?? 0}
          icon={LogIn}
        />
        <StatCard
          title="Salidas Hoy"
          value={stats?.today.departures ?? 0}
          icon={LogOut}
        />
        <StatCard
          title="Reservas Activas"
          value={stats?.activeReservations ?? 0}
          icon={CalendarCheck}
        />
        <StatCard
          title="Stock Bajo"
          value={stats?.lowStockItems ?? 0}
          icon={Package}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Ingresos por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenue?.data || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="roomRevenue" name="Habitación" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="consumptionRevenue" name="Consumos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Reservas por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reservationsByMonth?.data || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
