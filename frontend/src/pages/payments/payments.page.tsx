import { useState } from 'react';
import { usePendingByRoom } from '@/hooks/useOrders';
import { useCreatePayment, usePayments } from '@/hooks/usePayments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CreditCard, Receipt, Loader2 } from 'lucide-react';
import { toastSuccess } from '@/lib/notifications';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function PaymentsPage() {
  const { data: pendingGroups, isLoading } = usePendingByRoom();
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pagos</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Consumos Pendientes por Habitación</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Habitación</th>
                  <th className="px-4 py-3 text-left font-medium">Huésped</th>
                  <th className="px-4 py-3 text-right font-medium">Total Pendiente</th>
                  <th className="px-4 py-3 text-right font-medium">Pedidos</th>
                  <th className="px-4 py-3 text-center font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                ) : pendingGroups?.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Sin consumos pendientes</td></tr>
                ) : (
                  pendingGroups?.map((group: any) => (
                    <tr key={group.room.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{group.room.numero} - {group.room.nombre}</td>
                      <td className="px-4 py-3">{group.guest ? `${group.guest.nombres} ${group.guest.apellidos}` : '—'}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(group.total)}</td>
                      <td className="px-4 py-3 text-right">{group.orders.length}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <Button size="sm" onClick={() => { setSelectedRoom(group); setShowPaymentForm(true); }}>
                            <DollarSign className="mr-1 h-3 w-3" /> Cobrar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setSelectedRoom(group); setShowHistory(true); }}>
                            <Receipt className="mr-1 h-3 w-3" /> Historial
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <PaymentFormDialog
        open={showPaymentForm}
        onClose={() => setShowPaymentForm(false)}
        room={selectedRoom}
      />

      <PaymentHistoryDialog
        open={showHistory}
        onClose={() => setShowHistory(false)}
        room={selectedRoom}
      />
    </div>
  );
}

const METODOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'otros', label: 'Otros' },
];

function PaymentFormDialog({ open, onClose, room }: { open: boolean; onClose: () => void; room: any }) {
  const qc = useQueryClient();
  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [comprobante, setComprobante] = useState('');

  const createMut = useMutation({
    mutationFn: () => {
      const payload: any = {
        roomId: room?.room?.id,
        monto: Number(monto),
        metodoPago,
      };
      if (comprobante) payload.comprobante = comprobante;
      return import('@/api/payments.api').then((m) => m.paymentsApi.create(payload));
    },
    onSuccess: () => {
      toastSuccess('Pago registrado');
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      onClose();
      setMonto('');
      setMetodoPago('efectivo');
      setComprobante('');
    },
  });

  if (!room) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p><span className="text-muted-foreground">Habitación: </span>{room.room.numero} - {room.room.nombre}</p>
            <p><span className="text-muted-foreground">Huésped: </span>{room.guest ? `${room.guest.nombres} ${room.guest.apellidos}` : '—'}</p>
            <p className="font-bold text-lg mt-1">
              Total pendiente: {formatCurrency(room.total)}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Monto a cobrar</label>
            <Input type="number" step="0.01" min={0.01} max={room.total} value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Método de pago</label>
            <Select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} options={METODOS_PAGO} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Comprobante (opcional)</label>
            <Input value={comprobante} onChange={(e) => setComprobante(e.target.value)} placeholder="N° de recibo / referencia" />
          </div>

          <Button className="w-full" disabled={!monto || Number(monto) <= 0 || createMut.isPending} onClick={() => createMut.mutate()}>
            {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Registrar Pago - {formatCurrency(Number(monto) || 0)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PaymentHistoryDialog({ open, onClose, room }: { open: boolean; onClose: () => void; room: any }) {
  const { data: paymentsResponse, isLoading } = usePayments(
    room ? { roomId: room.room.id } : undefined
  );
  const payments = paymentsResponse?.data?.data || [];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historial de Pagos</DialogTitle>
        </DialogHeader>
        {room && (
          <div className="rounded-lg bg-muted p-3 text-sm mb-2">
            <span className="text-muted-foreground">Habitación: </span>
            <span className="font-medium">{room.room.numero} - {room.room.nombre}</span>
          </div>
        )}
        <h4 className="text-sm font-medium mb-2">Pagos registrados</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left font-medium">Fecha</th>
                <th className="px-3 py-2 text-right font-medium">Monto</th>
                <th className="px-3 py-2 text-left font-medium">Método</th>
                <th className="px-3 py-2 text-left font-medium">Usuario</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">Cargando...</td></tr>
              ) : payments?.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">Sin pagos registrados</td></tr>
              ) : (
                payments?.map((p: any) => (
                  <tr key={p.id} className="border-b">
                    <td className="px-3 py-2 text-muted-foreground">{formatDateTime(p.fecha)}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(p.monto)}</td>
                    <td className="px-3 py-2 capitalize"><Badge variant="outline">{p.metodoPago}</Badge></td>
                    <td className="px-3 py-2">{p.user?.nombres} {p.user?.apellidos}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end">
          <DialogClose asChild>
            <Button variant="outline">Cerrar</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
