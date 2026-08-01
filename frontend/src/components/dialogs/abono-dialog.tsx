import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { reservationsApi } from '@/api/reservations.api';
import { paymentMethodsApi } from '@/api/payment-methods.api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, HandCoins, CreditCard } from 'lucide-react';
import { formatDateShort, formatCurrency } from '@/lib/utils';
import { toastSuccess, toastError } from '@/lib/notifications';

export function AbonoDialog({
  reservation,
  open,
  onClose,
}: {
  reservation: any;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [monto, setMonto] = useState(0);
  const [metodoPagoId, setMetodoPagoId] = useState('');
  const [comprobante, setComprobante] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods-active'],
    queryFn: () => paymentMethodsApi.findAllActive(),
    enabled: open,
  });

  const abonoMut = useMutation({
    mutationFn: (dto: { monto: number; metodoPagoId: string; comprobante?: string; observaciones?: string }) =>
      reservationsApi.addAbono(reservation.id, dto),
    onSuccess: () => {
      toastSuccess('Abono registrado correctamente');
      qc.invalidateQueries({ queryKey: ['reservations'] });
      qc.invalidateQueries({ queryKey: ['stay-summary'] });
      qc.invalidateQueries({ queryKey: ['recibo-by-reservation'] });
      resetForm();
      onClose();
    },
    onError: () => toastError('No se pudo registrar el abono'),
  });

  const resetForm = () => {
    setMonto(0);
    setMetodoPagoId('');
    setComprobante('');
    setObservaciones('');
  };

  const resumen = reservation?.resumen;
  const payments = reservation?.payments || [];

  const handleSubmit = async () => {
    if (monto <= 0) {
      toastError('Ingrese un monto mayor a 0');
      return;
    }
    if (!metodoPagoId) {
      toastError('Seleccione un método de pago');
      return;
    }
    await abonoMut.mutateAsync({
      monto,
      metodoPagoId,
      comprobante: comprobante || undefined,
      observaciones: observaciones || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { resetForm(); onClose(); } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="h-5 w-5" /> Abono — {reservation?.codigo}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-200 p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Huésped</span>
              <span className="font-medium">{reservation?.guest?.nombres} {reservation?.guest?.apellidos}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Habitación</span>
              <span className="font-medium">{reservation?.room?.nombre} ({formatDateShort(reservation?.fechaEntrada)} — {formatDateShort(reservation?.fechaSalida)})</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center">
              <div className="rounded bg-muted p-2">
                <p className="text-[10px] text-muted-foreground">Total estadía</p>
                <p className="text-sm font-bold">{formatCurrency(resumen?.totalEstancia || 0)}</p>
                {Number(resumen?.totalRecargos) > 0 && (
                  <p className="text-[10px] text-violet-600">Recargos: {formatCurrency(resumen.totalRecargos)}</p>
                )}
                {Number(resumen?.totalPedidos) > 0 && (
                  <p className="text-[10px] text-red-500">Pedidos pend.: +{formatCurrency(resumen.totalPedidos)}</p>
                )}
              </div>
              <div className="rounded bg-green-50 p-2">
                <p className="text-[10px] text-green-700">Abonado</p>
                <p className="text-sm font-bold text-green-700">{formatCurrency(resumen?.totalPagado || 0)}</p>
              </div>
              <div className="rounded bg-amber-50 p-2">
                <p className="text-[10px] text-amber-700">Saldo</p>
                <p className="text-sm font-bold text-amber-700">{formatCurrency(resumen?.saldoPendiente || 0)}</p>
                {Number(resumen?.totalPedidos) > 0 && (
                  <p className="text-[10px] text-red-500">incluye pedidos</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Monto del abono</label>
                <Input
                  type="number" step="0.01" min={0}
                  placeholder="0.00"
                  value={monto || ''}
                  onChange={(e) => setMonto(Number(e.target.value))}
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Método de pago</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={metodoPagoId}
                  onChange={(e) => setMetodoPagoId(e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {(paymentMethods || []).map((pm: any) => (
                    <option key={pm.id} value={pm.id}>{pm.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Referencia / Comprobante</label>
              <Input placeholder="Ej. Consignación 12345" value={comprobante} onChange={(e) => setComprobante(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Observaciones</label>
              <Input placeholder="Ej. Abono parcial" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            </div>
          </div>

          {payments.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-1">
                <CreditCard className="h-4 w-4" /> Abonos registrados ({payments.length})
              </p>
              <div className="rounded-lg border divide-y text-sm max-h-40 overflow-y-auto">
                {payments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {formatDateShort(p.fecha)} · {p.metodoPago?.nombre || '—'}
                        {p.metodoPago?.financialAccount ? ` · ${p.metodoPago.financialAccount.nombre}` : ''}
                      </p>
                      {p.observaciones && <p className="text-xs text-muted-foreground">{p.observaciones}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-emerald-600">{formatCurrency(p.monto)}</span>
                      <Badge variant="success" className="text-[10px]">Abono</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">Cerrar</Button>
            </DialogClose>
            <Button className="flex-1" onClick={handleSubmit} disabled={abonoMut.isPending}>
              {abonoMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DollarSign className="mr-2 h-4 w-4" />}
              Registrar Abono
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
