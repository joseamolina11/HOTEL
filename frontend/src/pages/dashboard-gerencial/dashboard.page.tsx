import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardGerencialApi, GerencialSummary } from '@/api/dashboard-gerencial.api';
import { GerenciaNav } from '@/components/gerencia/gerencia-nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, Legend,
} from 'recharts';
import {
  LayoutDashboard, BedDouble, CalendarCheck, CalendarX, Wallet, TrendingUp,
  BarChart3, AlertTriangle, Lightbulb, RefreshCw, ArrowUpRight, ArrowDownRight, Minus, Users, DoorOpen,
} from 'lucide-react';

const TIPO_INSIGHT: Record<string, string> = {
  positivo: 'text-emerald-500',
  negativo: 'text-red-500',
  neutral: 'text-muted-foreground',
};

function TrendBadge({ trend }: { trend: { value: number; direction: 'up' | 'down' | 'flat' } }) {
  const Icon = trend.direction === 'up' ? ArrowUpRight : trend.direction === 'down' ? ArrowDownRight : Minus;
  const color = trend.direction === 'up' ? 'text-emerald-500' : trend.direction === 'down' ? 'text-red-500' : 'text-muted-foreground';
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Icon className="h-3.5 w-3.5" />
      {trend.value}%
    </span>
  );
}

export function GerencialDashboardPage() {
  const qc = useQueryClient();
  const { data, isLoading, isFetching } = useQuery<GerencialSummary>({
    queryKey: ['dashboard-gerencial', 'summary'],
    queryFn: () => dashboardGerencialApi.getSummary(),
    refetchInterval: 5 * 60 * 1000,
  });

  const occTrend = (data?.occupancyTrend ?? []).map((d) => ({
    ...d,
    label: formatDateShort(d.date),
  }));

  const revenueData = (data?.revenueByDay ?? []).map((d) => ({
    ...d,
    label: formatDateShort(d.date),
  }));

  return (
    <div className="space-y-4 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <LayoutDashboard className="h-6 w-6" /> Estadísticas Generales
          </h1>
          <p className="text-sm text-muted-foreground">
            Resumen ejecutivo del hotel. Actualizado{' '}
            {data?.asOf ? formatDateShort(data.asOf) : '—'}.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => qc.invalidateQueries({ queryKey: ['dashboard-gerencial'] })}
          disabled={isFetching}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Navegación entre módulos gerenciales */}
      <GerenciaNav />

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Cargando datos gerenciales...</CardContent>
        </Card>
      ) : (
        <>
          {/* KPIs principales */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard
              icon={<BedDouble className="h-5 w-5" />}
              label="Ocupación hoy"
              value={`${data?.occupancy.rate ?? 0}%`}
              sub={`${data?.occupancy.occupiedRooms ?? 0} / ${data?.occupancy.availableRooms ?? 0} habs.`}
              footer={<TrendBadge trend={data?.occupancy.trend ?? { value: 0, direction: 'flat' }} />}
              accent="bg-primary/10 text-primary"
            />
            <KpiCard
              icon={<Users className="h-5 w-5" />}
              label="En casa"
              value={String(data?.reservations.inHouse ?? 0)}
              sub={`${data?.reservations.upcoming ?? 0} reservas futuras`}
              accent="bg-sky-500/10 text-sky-500"
            />
            <KpiCard
              icon={<CalendarCheck className="h-5 w-5" />}
              label="Llegadas hoy"
              value={String(data?.reservations.arrivalsToday ?? 0)}
              sub="Check-ins programados"
              accent="bg-emerald-500/10 text-emerald-500"
            />
            <KpiCard
              icon={<CalendarX className="h-5 w-5" />}
              label="Salidas hoy"
              value={String(data?.reservations.departuresToday ?? 0)}
              sub="Check-outs programados"
              accent="bg-amber-500/10 text-amber-500"
            />
          </div>

          {/* Ingresos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Wallet className="h-4 w-4" /> Ingresos
              </CardTitle>
              <Badge variant="outline">Recaudo</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <RevenueCard
                  title="Hoy"
                  value={data?.revenue.today ?? 0}
                  trend={data?.revenue.todayVsYesterday}
                />
                <RevenueCard
                  title="Esta semana"
                  value={data?.revenue.week ?? 0}
                  trend={data?.revenue.weekVsPrevWeek}
                />
                <RevenueCard
                  title="Este mes"
                  value={data?.revenue.month ?? 0}
                  trend={data?.revenue.monthVsPrevMonth}
                />
              </div>
            </CardContent>
          </Card>

          {/* ADR / RevPAR */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <BarChart3 className="h-4 w-4" /> ADR
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Hoy</p>
                    <p className="text-2xl font-bold">{formatCurrency(data?.adrRevpar.adrToday ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">7 días</p>
                    <p className="flex items-center gap-2 text-2xl font-bold">
                      {formatCurrency(data?.adrRevpar.adr7d ?? 0)}
                      <TrendBadge trend={data?.adrRevpar.adrTrend ?? { value: 0, direction: 'flat' }} />
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="h-4 w-4" /> RevPAR
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Hoy</p>
                    <p className="text-2xl font-bold">{formatCurrency(data?.adrRevpar.revparToday ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">7 días</p>
                    <p className="flex items-center gap-2 text-2xl font-bold">
                      {formatCurrency(data?.adrRevpar.revpar7d ?? 0)}
                      <TrendBadge trend={data?.adrRevpar.revparTrend ?? { value: 0, direction: 'flat' }} />
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ocupación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <BedDouble className="h-4 w-4" /> Ocupación (14 días pasados + 7 proyectados)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={occTrend}>
                  <defs>
                    <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" className="text-xs" tick={{ fontSize: 10 }} interval={3} />
                  <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(value: any, name: any) =>
                      name === 'rate' ? [`${value}%`, 'Ocupación'] : [value, 'Habitaciones']
                    }
                    labelFormatter={(l) => `Fecha: ${l}`}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="occupiedRooms" name="Ocupadas" stroke="hsl(var(--primary))" fill="url(#occGrad)" />
                  <Line type="monotone" dataKey="rate" name="rate" stroke="#f59e0b" strokeDasharray="4 4" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Ingresos por día */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <BarChart3 className="h-4 w-4" /> Recaudo por día (últimos 14 días)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" className="text-xs" tick={{ fontSize: 10 }} interval={3} />
                  <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  <Bar dataKey="total" name="Ingresos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Alertas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.alerts.length ? (
                <ul className="space-y-2">
                  {data.alerts.map((a, i) => (
                    <li
                      key={i}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        a.type === 'critical'
                          ? 'border-red-500/30 bg-red-500/10 text-red-600'
                          : a.type === 'warning'
                            ? 'border-amber-500/30 bg-amber-500/10 text-amber-600'
                            : 'border-sky-500/30 bg-sky-500/10 text-sky-600'
                      }`}
                    >
                      {a.message}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">Sin alertas activas.</p>
              )}
            </CardContent>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Lightbulb className="h-4 w-4 text-amber-500" /> Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.insights.length ? (
                <ul className="space-y-2">
                  {data.insights.map((ins, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${TIPO_INSIGHT[ins.tipo]}`} />
                      <span className="text-muted-foreground">{ins.mensaje}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">Sin insights.</p>
              )}
            </CardContent>
          </Card>

          {/* Próximas llegadas / salidas */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <DoorOpen className="h-4 w-4 text-emerald-500" /> Próximas llegadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StayList items={data?.reservations.nextArrivals ?? []} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <CalendarX className="h-4 w-4 text-amber-500" /> Próximas salidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StayList items={data?.reservations.nextDepartures ?? []} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ icon, label, value, sub, footer, accent }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  footer?: React.ReactNode;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span className={`rounded-lg p-2 ${accent}`}>{icon}</span>
        </div>
        <p className="text-2xl font-bold leading-tight">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        {footer && <div className="mt-2">{footer}</div>}
      </CardContent>
    </Card>
  );
}

function RevenueCard({ title, value, trend }: {
  title: string;
  value: number;
  trend?: { value: number; direction: 'up' | 'down' | 'flat' };
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        {trend && <TrendBadge trend={trend} />}
      </div>
      <p className="mt-1 text-xl font-bold">{formatCurrency(value)}</p>
    </div>
  );
}

function StayList({ items }: { items: GerencialSummary['reservations']['nextArrivals'] }) {
  if (!items.length) {
    return <p className="py-4 text-center text-sm text-muted-foreground">Sin próximas estadías.</p>;
  }
  return (
    <ul className="divide-y">
      {items.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {r.guest ? `${r.guest.nombres} ${r.guest.apellidos}` : r.codigo}
            </p>
            <p className="text-xs text-muted-foreground">
              {r.room ? `${r.room.numero} · ` : ''}{formatDateShort(r.fechaEntrada)} → {formatDateShort(r.fechaSalida)}
            </p>
          </div>
          <Badge variant="outline">{r.codigo}</Badge>
        </li>
      ))}
    </ul>
  );
}
