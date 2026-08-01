import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statisticsApi } from '@/api/statistics.api';
import { GerenciaNav } from '@/components/gerencia/gerencia-nav';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  BarChart3, BedDouble, ShoppingCart, Zap, Receipt, PieChart, X,
} from 'lucide-react';

interface GerencialStats {
  salesByDate: { fecha: string; pedidos: number; alojamientos: number; recargos: number; total: number }[];
  paymentMethods: { id: string; nombre: string; tipo: string; total: number; cantidad: number }[];
  expensesByCategory: { id: string; nombre: string; total: number; cantidad: number }[];
  expensesByPaymentMethod: { id: string; nombre: string; tipo: string; total: number; cantidad: number }[];
  totals: { pedidos: number; alojamientos: number; recargos: number; ventas: number; egresos: number };
}

const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const TIPO_COLOR: Record<string, string> = {
  efectivo: 'bg-emerald-500',
  transferencia: 'bg-sky-500',
  tarjeta: 'bg-violet-500',
  otros: 'bg-amber-500',
};

export function GerencialPage() {
  const today = new Date();
  const defaultDesde = new Date();
  defaultDesde.setDate(today.getDate() - 30);

  const [desde, setDesde] = useState(toDateKey(defaultDesde));
  const [hasta, setHasta] = useState(toDateKey(today));

  const params: Record<string, string> = { desde, hasta };

  const { data, isLoading } = useQuery({
    queryKey: ['statistics', 'gerencial', desde, hasta],
    queryFn: () => statisticsApi.getGerencial(params),
  });

  const stats: GerencialStats | undefined = data;
  const totals = stats?.totals;

  const chartData = useMemo(
    () =>
      (stats?.salesByDate ?? []).map((r) => ({
        ...r,
        fecha: formatDate(r.fecha),
        Alojamientos: r.alojamientos,
        Pedidos: r.pedidos,
        Recargos: r.recargos,
      })),
    [stats],
  );

  const hasFilters = !!desde || !!hasta;
  const clearFilters = () => {
    setDesde(toDateKey(defaultDesde));
    setHasta(toDateKey(today));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <PieChart className="h-6 w-6" /> Estadísticas Gerencial
          </h1>
          <p className="text-sm text-muted-foreground">
            Ventas por fecha y por forma de pago, egresos por categoría y por forma de pago.
          </p>
        </div>
      </div>

      <GerenciaNav />

      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Desde</span>
              <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-40" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Hasta</span>
              <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-40" />
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" /> Limpiar
              </Button>
            )}
            {isLoading && <span className="ml-auto text-sm text-muted-foreground">Cargando...</span>}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Ventas Totales" value={formatCurrency(totals?.ventas ?? 0)} icon={BarChart3} description="Alojamientos + pedidos + recargos" />
        <StatCard title="Alojamientos" value={formatCurrency(totals?.alojamientos ?? 0)} icon={BedDouble} />
        <StatCard title="Pedidos" value={formatCurrency(totals?.pedidos ?? 0)} icon={ShoppingCart} />
        <StatCard title="Recargos" value={formatCurrency(totals?.recargos ?? 0)} icon={Zap} />
        <StatCard title="Egresos" value={formatCurrency(totals?.egresos ?? 0)} icon={Receipt} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Ventas por Fecha</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="fecha" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="Alojamientos" stackId="s" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Pedidos" stackId="s" fill="#0ea5e9" />
              <Bar dataKey="Recargos" stackId="s" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left font-medium">Fecha</th>
                  <th className="px-4 py-2 text-right font-medium">Alojamientos</th>
                  <th className="px-4 py-2 text-right font-medium">Pedidos</th>
                  <th className="px-4 py-2 text-right font-medium">Recargos</th>
                  <th className="px-4 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.salesByDate ?? []).map((r) => (
                  <tr key={r.fecha} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-2">{formatDate(r.fecha)}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(r.alojamientos)}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(r.pedidos)}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(r.recargos)}</td>
                    <td className="px-4 py-2 text-right font-semibold">{formatCurrency(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <GroupedCard
          title="Ventas por Forma de Pago"
          rows={(stats?.paymentMethods ?? []).map((r) => ({
            id: r.id,
            nombre: r.nombre,
            total: r.total,
            cantidad: r.cantidad,
            tipo: r.tipo,
            color: TIPO_COLOR[r.tipo] ?? TIPO_COLOR.otros,
          }))}
          accent="text-emerald-600"
        />
        <GroupedCard
          title="Egresos por Forma de Pago"
          rows={(stats?.expensesByPaymentMethod ?? []).map((r) => ({
            id: r.id,
            nombre: r.nombre,
            total: r.total,
            cantidad: r.cantidad,
            tipo: r.tipo,
            color: TIPO_COLOR[r.tipo] ?? TIPO_COLOR.otros,
          }))}
          accent="text-red-600"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Egresos por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <GroupedList
            rows={(stats?.expensesByCategory ?? []).map((r) => ({ id: r.id, nombre: r.nombre, total: r.total, cantidad: r.cantidad }))}
            accent="text-red-600"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function GroupedCard({ title, rows, accent }: {
  title: string;
  rows: { id: string; nombre: string; total: number; cantidad: number; tipo: string; color: string }[];
  accent: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <GroupedList rows={rows} accent={accent} showTipo />
      </CardContent>
    </Card>
  );
}

function GroupedList({ rows, accent, showTipo = false }: {
  rows: { id: string; nombre: string; total: number; cantidad: number; tipo?: string; color?: string }[];
  accent: string;
  showTipo?: boolean;
}) {
  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">Sin datos en el período seleccionado</p>
      )}
      {rows.map((r) => {
        const pct = grandTotal > 0 ? Math.round((r.total / grandTotal) * 100) : 0;
        return (
          <div key={r.id}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {showTipo && r.tipo && (
                  <span className={`h-2.5 w-2.5 rounded-full ${r.color}`} />
                )}
                <span className="font-medium">{r.nombre}</span>
                <Badge variant="outline" className="text-muted-foreground">
                  {r.cantidad}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{pct}%</span>
                <span className={`font-semibold ${accent}`}>{formatCurrency(r.total)}</span>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${r.color ?? 'bg-primary'}`}
                style={{ width: `${Math.max(2, pct)}%` }}
              />
            </div>
          </div>
        );
      })}
      {grandTotal > 0 && (
        <div className="flex items-center justify-between border-t pt-2 text-sm">
          <span className="font-medium text-muted-foreground">Total</span>
          <span className="font-bold">{formatCurrency(grandTotal)}</span>
        </div>
      )}
    </div>
  );
}
