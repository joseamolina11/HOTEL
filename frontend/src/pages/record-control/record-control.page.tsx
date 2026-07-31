import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { recordControlApi, RecordControlType } from '@/api/record-control.api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils';
import { Trash2, FileX, Percent, Wallet, X } from 'lucide-react';

const CONFIG: Record<RecordControlType, { title: string; description: string; icon: any; empty: string }> = {
  'deleted-reservations': {
    title: 'Reservas Eliminadas',
    description: 'Reservas canceladas y fuera de operación.',
    icon: Trash2,
    empty: 'No hay reservas eliminadas en el período seleccionado',
  },
  'deleted-surcharges': {
    title: 'Recargos Eliminados',
    description: 'Recargos que fueron eliminados de una reserva.',
    icon: FileX,
    empty: 'No hay recargos eliminados en el período seleccionado',
  },
  discounts: {
    title: 'Descuentos Realizados',
    description: 'Reservas a las que se les aplicó un descuento.',
    icon: Percent,
    empty: 'No hay descuentos registrados en el período seleccionado',
  },
  'unpaid-reservations': {
    title: 'Reservas Sin Pagar',
    description: 'Reservas con saldo pendiente mayor a cero.',
    icon: Wallet,
    empty: 'No hay reservas sin pagar en el período seleccionado',
  },
};

export function DeletedReservationsPage() {
  return <RecordControlTable type="deleted-reservations" />;
}

export function DeletedSurchargesPage() {
  return <RecordControlTable type="deleted-surcharges" />;
}

export function DiscountsPage() {
  return <RecordControlTable type="discounts" />;
}

export function UnpaidReservationsPage() {
  return <RecordControlTable type="unpaid-reservations" />;
}

function RecordControlTable({ type }: { type: RecordControlType }) {
  const config = CONFIG[type];
  const Icon = config.icon;
  const [page, setPage] = useState(1);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const params: Record<string, string> = { page: String(page), limit: '15' };
  if (desde) params.desde = desde;
  if (hasta) params.hasta = hasta;

  const { data, isLoading } = useQuery({
    queryKey: ['record-control', type, page, desde, hasta],
    queryFn: () => recordControlApi.findAll(type, params),
  });

  const rows: any[] = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const hasFilters = !!desde || !!hasta;

  const clearFilters = () => {
    setDesde('');
    setHasta('');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Icon className="h-6 w-6" /> {config.title}
          </h1>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
      </div>

      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Desde</span>
              <Input
                type="date"
                value={desde}
                onChange={(e) => { setDesde(e.target.value); setPage(1); }}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Hasta</span>
              <Input
                type="date"
                value={hasta}
                onChange={(e) => { setHasta(e.target.value); setPage(1); }}
                className="w-40"
              />
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" /> Limpiar
              </Button>
            )}
            <div className="ml-auto text-sm text-muted-foreground">
              {total} registro{total === 1 ? '' : 's'}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {type === 'deleted-surcharges' ? (
            <DeletedSurchargesTable rows={rows} loading={isLoading} empty={config.empty} />
          ) : (
            <ReservationsTable rows={rows} loading={isLoading} empty={config.empty} type={type} />
          )}
        </CardContent>
      </Card>

      <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

function ReservationsTable({ rows, loading, empty, type }: {
  rows: any[];
  loading: boolean;
  empty: string;
  type: RecordControlType;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="px-4 py-3 text-left font-medium">Código</th>
            <th className="px-4 py-3 text-left font-medium">Huésped</th>
            <th className="px-4 py-3 text-left font-medium">Habitación</th>
            <th className="px-4 py-3 text-left font-medium">Estadía</th>
            <th className="px-4 py-3 text-left font-medium">Estado</th>
            <th className="px-4 py-3 text-right font-medium">Total</th>
            {type !== 'deleted-reservations' && (
              <th className="px-4 py-3 text-right font-medium">Descuento</th>
            )}
            <th className="px-4 py-3 text-right font-medium">Pagado</th>
            <th className="px-4 py-3 text-right font-medium">Debe</th>
            {type === 'deleted-reservations' && (
              <th className="px-4 py-3 text-left font-medium">Motivo</th>
            )}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">{empty}</td></tr>
          ) : (
            rows.map((r) => {
              const saldo = Number(r.resumen?.saldoPendiente ?? 0);
              return (
                <tr key={r.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-primary">{r.codigo || '—'}</div>
                    {r.checkinConsecutivo && (
                      <div className="text-xs text-muted-foreground">{r.checkinConsecutivo}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div>{r.guest?.nombres} {r.guest?.apellidos}</div>
                    <div className="text-xs text-muted-foreground">{r.guest?.documento || ''}</div>
                  </td>
                  <td className="px-4 py-3">
                    {r.room ? <span>{r.room.numero} <span className="text-muted-foreground">· {r.room.nombre}</span></span> : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div>{formatDate(r.fechaEntrada)}</div>
                    <div className="text-xs text-muted-foreground">→ {formatDate(r.fechaSalida)}</div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={r.estado} /></td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(r.resumen?.totalEstancia || 0)}</td>
                  {type !== 'deleted-reservations' && (
                    <td className="px-4 py-3 text-right">{formatCurrency(r.descuento || 0)}</td>
                  )}
                  <td className="px-4 py-3 text-right">{formatCurrency(r.resumen?.totalPagado || 0)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(saldo)}
                  </td>
                  {type === 'deleted-reservations' && (
                    <td className="px-4 py-3 max-w-[220px] truncate text-muted-foreground">{r.observaciones || '—'}</td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function DeletedSurchargesTable({ rows, loading, empty }: {
  rows: any[];
  loading: boolean;
  empty: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="px-4 py-3 text-left font-medium">Consecutivo</th>
            <th className="px-4 py-3 text-left font-medium">Descripción</th>
            <th className="px-4 py-3 text-left font-medium">Tipo</th>
            <th className="px-4 py-3 text-left font-medium">Tercero</th>
            <th className="px-4 py-3 text-right font-medium">Subtotal</th>
            <th className="px-4 py-3 text-left font-medium">Fecha</th>
            <th className="px-4 py-3 text-left font-medium">Eliminado el</th>
            <th className="px-4 py-3 text-left font-medium">Reserva</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">{empty}</td></tr>
          ) : (
            rows.map((s) => (
              <tr key={s.id} className="border-b hover:bg-muted/50">
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-violet-600 bg-violet-50 border-violet-200">{s.consecutivo || '—'}</Badge>
                </td>
                <td className="px-4 py-3 max-w-[220px] truncate">{s.descripcion || '—'}</td>
                <td className="px-4 py-3">{s.surchargeType?.nombre || '—'}</td>
                <td className="px-4 py-3">{s.tercero?.nombre || s.tercero?.razonSocial || '—'}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(s.subtotal)}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDateTime(s.fecha)}</td>
                <td className="px-4 py-3 text-red-600">{s.deletedAt ? formatDateTime(s.deletedAt) : '—'}</td>
                <td className="px-4 py-3">
                  {s.reservation ? (
                    <div>
                      <div className="text-primary">{s.reservation.codigo || '—'}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.reservation.guest?.nombres} {s.reservation.guest?.apellidos}
                        {s.reservation.room ? ` · Hab ${s.reservation.room.numero}` : ''}
                      </div>
                    </div>
                  ) : '—'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
