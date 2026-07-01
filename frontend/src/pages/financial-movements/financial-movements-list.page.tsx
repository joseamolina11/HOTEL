import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { financialMovementsApi } from '@/api/financial-movements.api';
import { financialAccountsApi } from '@/api/financial-accounts.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { ExpenseDetailDialog } from '@/components/dialogs/expense-detail-dialog';
import { ReciboCajaDetailDialog } from '@/components/dialogs/recibo-caja-detail-dialog';
import { ReservationDetailDialog } from '@/components/dialogs/reservation-detail-dialog';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, Plus, Minus, Settings, Circle } from 'lucide-react';

const TIPO_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'INGRESO', label: 'Ingreso' },
  { value: 'EGRESO', label: 'Egreso' },
  { value: 'TRANSFERENCIA_ENTRADA', label: 'Transferencia Entrada' },
  { value: 'TRANSFERENCIA_SALIDA', label: 'Transferencia Salida' },
  { value: 'AJUSTE', label: 'Ajuste' },
  { value: 'APERTURA_CAJA', label: 'Apertura Caja' },
  { value: 'CIERRE_CAJA', label: 'Cierre Caja' },
];

const TIPO_ICONS: Record<string, any> = {
  INGRESO: ArrowUpRight,
  EGRESO: ArrowDownRight,
  TRANSFERENCIA_ENTRADA: ArrowLeftRight,
  TRANSFERENCIA_SALIDA: ArrowLeftRight,
  AJUSTE: Settings,
  APERTURA_CAJA: Plus,
  CIERRE_CAJA: Minus,
};

const TIPO_COLORS: Record<string, string> = {
  INGRESO: 'text-green-600 bg-green-50 border-green-200',
  EGRESO: 'text-red-600 bg-red-50 border-red-200',
  TRANSFERENCIA_ENTRADA: 'text-blue-600 bg-blue-50 border-blue-200',
  TRANSFERENCIA_SALIDA: 'text-orange-600 bg-orange-50 border-orange-200',
  AJUSTE: 'text-purple-600 bg-purple-50 border-purple-200',
  APERTURA_CAJA: 'text-teal-600 bg-teal-50 border-teal-200',
  CIERRE_CAJA: 'text-gray-600 bg-gray-50 border-gray-200',
};

export function FinancialMovementsListPage() {
  const [page, setPage] = useState(1);
  const [accountId, setAccountId] = useState('');
  const [tipo, setTipo] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [expenseDetailId, setExpenseDetailId] = useState<string | null>(null);
  const [reciboDetailId, setReciboDetailId] = useState<string | null>(null);
  const [reservationDetail, setReservationDetail] = useState<any>(null);

  const { data: accounts } = useQuery({
    queryKey: ['financial-accounts-all'],
    queryFn: () => financialAccountsApi.findAllActive(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['financial-movements', page, accountId, tipo, desde, hasta],
    queryFn: () => financialMovementsApi.findAll({
      page: String(page),
      limit: '10',
      ...(accountId ? { accountId } : {}),
      ...(tipo ? { tipo } : {}),
      ...(desde ? { desde } : {}),
      ...(hasta ? { hasta } : {}),
    }),
  });

  const movements = (data as any)?.data?.data || [];
  const totalPages = (data as any)?.data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Movimientos Financieros</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="w-56">
              <Select
                value={accountId}
                onChange={(e) => { setAccountId(e.target.value); setPage(1); }}
                options={[
                  { value: '', label: 'Todas las cuentas' },
                  ...(accounts || []).map((a: any) => ({ value: a.id, label: a.nombre })),
                ]}
              />
            </div>
            <div className="w-44">
              <Select value={tipo} onChange={(e) => { setTipo(e.target.value); setPage(1); }} options={TIPO_OPTIONS} />
            </div>
            <div>
              <Input type="date" value={desde} onChange={(e) => { setDesde(e.target.value); setPage(1); }} placeholder="Desde" className="w-40" />
            </div>
            <div>
              <Input type="date" value={hasta} onChange={(e) => { setHasta(e.target.value); setPage(1); }} placeholder="Hasta" className="w-40" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Libro de Movimientos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium">Cuenta</th>
                  <th className="px-4 py-3 text-left font-medium">Concepto</th>
                  <th className="px-4 py-3 text-right font-medium">Monto</th>
                  <th className="px-4 py-3 text-right font-medium">Saldo Anterior</th>
                  <th className="px-4 py-3 text-right font-medium">Saldo Posterior</th>
                  <th className="px-4 py-3 text-left font-medium">Ref.</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                ) : movements.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Sin movimientos registrados</td></tr>
                ) : movements.map((m: any) => {
                  const TipoIcon = TIPO_ICONS[m.tipo] || Circle;
                  const isIngreso = ['INGRESO', 'TRANSFERENCIA_ENTRADA', 'APERTURA_CAJA'].includes(m.tipo);
                  const colorClass = TIPO_COLORS[m.tipo] || '';
                  return (
                    <tr key={m.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 text-muted-foreground text-xs">{formatDateTime(m.fechaMovimiento)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={colorClass}>
                          <TipoIcon className="h-3 w-3 mr-1" /> {TIPO_OPTIONS.find(o => o.value === m.tipo)?.label || m.tipo}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{m.account?.nombre || '—'}</td>
                      <td className="px-4 py-3 max-w-[200px] truncate">
                        {m.referenciaTipo === 'expense' ? (
                          <button className="text-primary hover:underline cursor-pointer text-left" onClick={() => setExpenseDetailId(m.referenciaId)}>
                            {m.concepto || '—'}
                          </button>
                        ) : m.reciboCaja ? (
                          <button className="text-primary hover:underline cursor-pointer text-left" onClick={() => setReciboDetailId(m.reciboCaja.id)}>
                            {m.concepto || '—'}
                          </button>
                        ) : m.concepto || '—'}
                        {m.reciboCaja?.reservation && (
                          <button className="text-xs text-muted-foreground hover:text-primary hover:underline cursor-pointer ml-1" onClick={() => setReservationDetail(m.reciboCaja.reservation)}>
                            ({m.reciboCaja.reservation.codigo})
                          </button>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${isIngreso ? 'text-green-600' : 'text-red-600'}`}>
                        {isIngreso ? '+' : '-'}{formatCurrency(m.monto)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{formatCurrency(m.saldoAnterior)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold">{formatCurrency(m.saldoPosterior)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {m.referenciaTipo === 'expense' ? (
                          <button className="text-primary hover:underline cursor-pointer" onClick={() => setExpenseDetailId(m.referenciaId)}>
                            Egreso
                          </button>
                        ) : m.reciboCaja ? (
                          <div className="flex items-center gap-1">
                            <button className="text-primary hover:underline cursor-pointer" onClick={() => setReciboDetailId(m.reciboCaja.id)}>
                              {m.reciboCaja.codigo}
                            </button>
                            {m.reciboCaja.reservation && (
                              <button className="text-muted-foreground hover:text-primary hover:underline cursor-pointer" onClick={() => setReservationDetail(m.reciboCaja.reservation)}>
                                ({m.reciboCaja.reservation.codigo})
                              </button>
                            )}
                          </div>
                        ) : m.referenciaTipo || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
      <ExpenseDetailDialog key={expenseDetailId} expenseId={expenseDetailId} open={!!expenseDetailId} onClose={() => setExpenseDetailId(null)} />
      <ReciboCajaDetailDialog reciboId={reciboDetailId} open={!!reciboDetailId} onClose={() => setReciboDetailId(null)} />
      <ReservationDetailDialog
        reservation={reservationDetail}
        open={!!reservationDetail}
        onClose={() => setReservationDetail(null)}
      />
    </div>
  );
}
