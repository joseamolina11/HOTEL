import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkoutApi, StaySummary } from '@/api/checkout.api';
import { paymentMethodsApi } from '@/api/payment-methods.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { LogOut, AlertTriangle, Loader2, X, Printer, FileText, ExternalLink } from 'lucide-react';
import { toastSuccess } from '@/lib/notifications';
import { formatDateShort, formatCurrency } from '@/lib/utils';
import { useSearchParams } from 'react-router-dom';
import { printReceipt } from '@/components/checkout/receipt-ticket';

export function CheckOutListPage() {
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selectedReservation, setSelectedReservation] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['check-out-pending'],
    queryFn: () => checkoutApi.findPending(),
    refetchInterval: 30000,
  });

  const todayDepartures = data?.todayDepartures || [];
  const allCheckedIn = data?.allCheckedIn || [];

  useEffect(() => {
    const roomId = searchParams.get('roomId');
    if (roomId && data) {
      const found = [...todayDepartures, ...allCheckedIn].find(
        (r: any) => r.room?.id === roomId,
      );
      if (found) {
        setSelectedReservation(found);
      }
    }
  }, [data, searchParams]);

  const handleProcessClick = (reservation: any) => {
    setSelectedReservation(reservation);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Check-Out</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Salidas de Hoy</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Código</th>
                  <th className="px-4 py-3 text-left font-medium">Huésped</th>
                  <th className="px-4 py-3 text-left font-medium">Habitación</th>
                  <th className="px-4 py-3 text-left font-medium">Entrada</th>
                  <th className="px-4 py-3 text-left font-medium">Salida</th>
                  <th className="px-4 py-3 text-center font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                ) : todayDepartures.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Sin salidas programadas para hoy
                  </td></tr>
                ) : (
                  todayDepartures.map((res: any) => (
                    <tr key={res.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{res.codigo}</td>
                      <td className="px-4 py-3">{res.guest?.nombres} {res.guest?.apellidos}</td>
                      <td className="px-4 py-3">{res.room?.nombre}</td>
                      <td className="px-4 py-3">{formatDateShort(res.fechaEntrada)}</td>
                      <td className="px-4 py-3">{formatDateShort(res.fechaSalida)}</td>
                      <td className="px-4 py-3 text-center">
                        <Button size="sm" variant="destructive" onClick={() => handleProcessClick(res)}>
                          <LogOut className="mr-1 h-3 w-3" /> Procesar
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Huéspedes con Check-In Activo</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Código</th>
                  <th className="px-4 py-3 text-left font-medium">Huésped</th>
                  <th className="px-4 py-3 text-left font-medium">Habitación</th>
                  <th className="px-4 py-3 text-left font-medium">Entrada</th>
                  <th className="px-4 py-3 text-left font-medium">Salida</th>
                  <th className="px-4 py-3 text-center font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                ) : allCheckedIn.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Sin huéspedes con check-in activo
                  </td></tr>
                ) : (
                  allCheckedIn.map((res: any) => (
                    <tr key={res.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{res.codigo}</td>
                      <td className="px-4 py-3">{res.guest?.nombres} {res.guest?.apellidos}</td>
                      <td className="px-4 py-3">{res.room?.nombre}</td>
                      <td className="px-4 py-3">{formatDateShort(res.fechaEntrada)}</td>
                      <td className="px-4 py-3">{formatDateShort(res.fechaSalida)}</td>
                      <td className="px-4 py-3 text-center">
                        <Button size="sm" variant="destructive" onClick={() => handleProcessClick(res)}>
                          <LogOut className="mr-1 h-3 w-3" /> Procesar
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <StaySummaryDialog
        reservation={selectedReservation}
        onClose={() => setSelectedReservation(null)}
        onSuccess={() => {
          setSelectedReservation(null);
          qc.invalidateQueries({ queryKey: ['check-out-pending'] });
          qc.invalidateQueries({ queryKey: ['reservations'] });
          qc.invalidateQueries({ queryKey: ['rooms'] });
        }}
      />
    </div>
  );
}

function StaySummaryDialog({
  reservation,
  onClose,
  onSuccess,
}: {
  reservation: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [observaciones, setObservaciones] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['check-out-summary', reservation?.id],
    queryFn: () => checkoutApi.getStaySummary(reservation.id),
    enabled: !!reservation,
  });

  const checkOutMut = useMutation({
    mutationFn: (dto: { reservationId: string; observaciones?: string }) =>
      checkoutApi.checkOut(dto),
    onSuccess: () => {
      toastSuccess('Check-Out registrado correctamente');
      onSuccess();
    },
  });

  return (
    <Dialog open={!!reservation} onOpenChange={(v) => { if (!v && !checkOutMut.isPending) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" /> Procesar Check-Out
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 py-8 text-destructive">
            <AlertTriangle className="h-8 w-8" />
            <p className="text-sm">Error al cargar resumen de estancia</p>
          </div>
        ) : !data ? null : (
          <StaySummaryContent data={data} checkOutMut={checkOutMut} observaciones={observaciones} setObservaciones={setObservaciones} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function StaySummaryContent({
  data,
  checkOutMut,
  observaciones,
  setObservaciones,
}: {
  data: StaySummary;
  checkOutMut: any;
  observaciones: string;
  setObservaciones: (v: string) => void;
}) {
  const s = data.summary;
  const [payments, setPayments] = useState<{ monto: number; metodoPagoId: string; comprobante?: string }[]>([]);

  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods-active'],
    queryFn: () => paymentMethodsApi.findAllActive(),
  });

  const addPayment = () => {
    const firstId = (paymentMethods || [])[0]?.id || '';
    setPayments([...payments, { monto: 0, metodoPagoId: firstId }]);
  };

  useEffect(() => {
    if ((paymentMethods?.length || 0) > 0 && payments.length === 0) {
      const firstId = paymentMethods[0].id;
      setPayments([{ monto: 0, metodoPagoId: firstId }]);
    }
  }, [paymentMethods]);

  const updatePayment = (idx: number, field: string, value: any) => {
    const updated = [...payments];
    (updated[idx] as any)[field] = value;
    setPayments(updated);
  };

  const removePayment = (idx: number) => {
    setPayments(payments.filter((_, i) => i !== idx));
  };

  const totalPayments = payments.reduce((sum, p) => sum + Number(p.monto || 0), 0);
  const saldoRestante = s.saldoPendiente - totalPayments;

  const handleCheckOut = () => {
    checkOutMut.mutate({
      reservationId: data.reservation.id,
      observaciones,
      payments: payments.filter((p) => Number(p.monto) > 0),
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Reserva</span>
          <span className="font-medium">{data.reservation.codigo}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Huésped</span>
          <span className="font-medium">
            {data.reservation.guest?.nombres} {data.reservation.guest?.apellidos}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Habitación</span>
          <span className="font-medium">{data.reservation.room?.nombre}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tipo</span>
          <span>{data.reservation.room?.roomType?.nombre}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Período</span>
          <span>{formatDateShort(data.reservation.fechaEntrada)} — {formatDateShort(data.reservation.fechaSalida)}</span>
        </div>
      </div>

      {data.reservation.contratoFile && (
        <div className="flex items-center gap-2 rounded-lg border p-3 text-sm">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 truncate">{data.reservation.contratoFile.originalName}</span>
          <a href={data.reservation.contratoFile.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
            Ver Contrato <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      <div className="rounded-lg border">
        <div className="border-b px-4 py-2 text-sm font-medium bg-muted/50">
          Resumen de Cargos
        </div>
        <div className="divide-y">
          <div className="flex justify-between px-4 py-2 text-sm">
            <span>Alojamiento ({s.noches} noche{s.noches !== 1 ? 's' : ''} x {formatCurrency(s.precioPorNoche)})</span>
            <span className="font-medium">{formatCurrency(s.totalHabitacion)}</span>
          </div>
        </div>

        {s.consumos.length > 0 && (
          <div>
            <div className="border-t border-b px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
              Consumos ({s.consumos.length})
            </div>
            {s.consumos.map((c: any) => (
              <div key={c.id} className="flex justify-between px-4 py-2 text-sm">
                <span className="text-muted-foreground">
                  {c.inventoryItem?.nombre || 'Producto'} x{c.cantidad}
                </span>
                <span>{formatCurrency(c.subtotal)}</span>
              </div>
            ))}
          </div>
        )}

        {s.pedidos?.length > 0 && (
          <div>
            <div className="border-t border-b px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
              Pedidos Pendientes ({s.pedidos.length})
            </div>
            {s.pedidos.map((order: any) => (
              <div key={order.id} className="px-4 py-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>{order.codigo}</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between pl-4 text-xs text-muted-foreground">
                    <span>{item.inventoryItem?.nombre} x{item.cantidad}</span>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="border-t bg-muted/30 px-4 py-3 flex justify-between text-sm font-bold">
          <span>Total Estancia</span>
          <span>{formatCurrency(s.totalEstancia)}</span>
        </div>
      </div>

      {s.payments?.length > 0 && (
        <div className="rounded-lg border border-green-200">
          <div className="border-b px-4 py-2 text-xs font-medium text-green-700 bg-green-50">
            Pagos Realizados
          </div>
          {s.payments.map((p: any) => (
            <div key={p.id} className="flex justify-between px-4 py-2 text-sm">
              <span className="text-muted-foreground">{p.metodoPago?.nombre || '—'} {p.comprobante ? `(${p.comprobante})` : ''}</span>
              <span className="font-medium text-green-700">{formatCurrency(p.monto)}</span>
            </div>
          ))}
          <div className="border-t bg-green-50/50 px-4 py-2 flex justify-between text-sm font-medium">
            <span>Total Pagado</span>
            <span className="text-green-700">{formatCurrency(s.totalPagado)}</span>
          </div>
        </div>
      )}

      <div className="rounded-lg border">
        <div className="border-b px-4 py-2 text-sm font-medium bg-muted/50 flex justify-between">
          <span>Saldo Pendiente</span>
          <span className={s.saldoPendiente > 0 ? 'text-destructive' : 'text-green-600'}>
            {formatCurrency(s.saldoPendiente)}
          </span>
        </div>
      </div>

      {s.saldoPendiente > 0 && (
        <div className="rounded-lg border border-amber-200">
          <div className="border-b px-4 py-2 text-xs font-medium text-amber-700 bg-amber-50 flex justify-between items-center">
            <span>Registrar Pago</span>
            <Button type="button" size="sm" variant="outline" onClick={addPayment}>
              + Agregar forma de pago
            </Button>
          </div>
          <div className="divide-y">
            {payments.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2 px-4 py-2">
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  max={s.saldoPendiente}
                  placeholder="Monto"
                  className="w-24 h-8 text-xs"
                  value={p.monto || ''}
                  onChange={(e) => updatePayment(idx, 'monto', Number(e.target.value))}
                />
                <select
                  className="h-8 rounded-md border px-2 text-xs flex-1"
                  value={p.metodoPagoId}
                  onChange={(e) => updatePayment(idx, 'metodoPagoId', e.target.value)}
                >
                  {(paymentMethods || []).map((pm: any) => (
                    <option key={pm.id} value={pm.id}>{pm.nombre}</option>
                  ))}
                </select>
                <Input
                  placeholder="Comprobante"
                  className="flex-1 h-8 text-xs"
                  value={p.comprobante || ''}
                  onChange={(e) => updatePayment(idx, 'comprobante', e.target.value)}
                />
                {payments.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removePayment(idx)}>
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {totalPayments > 0 && (
            <div className="border-t bg-amber-50/50 px-4 py-2 flex justify-between text-sm font-medium">
              <span>Total a cobrar ahora</span>
              <span className={totalPayments > 0 ? 'text-amber-700' : ''}>{formatCurrency(totalPayments)}</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Observaciones</label>
        <Input
          placeholder="Opcional — ej. salida voluntaria, daños, etc."
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
        />
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => printReceipt({ hotelConfig: data.hotelConfig, reservation: data.reservation, summary: data.summary })}
        >
          <Printer className="mr-2 h-4 w-4" /> Imprimir
        </Button>
        <DialogClose asChild>
          <Button variant="outline" className="flex-1" disabled={checkOutMut.isPending}>
            Cancelar
          </Button>
        </DialogClose>
        <Button
          className="flex-1"
          variant="destructive"
          disabled={checkOutMut.isPending}
          onClick={handleCheckOut}
        >
          {checkOutMut.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
          ) : (
            <><LogOut className="mr-2 h-4 w-4" /> Confirmar Check-Out</>
          )}
        </Button>
      </div>
    </div>
  );
}
