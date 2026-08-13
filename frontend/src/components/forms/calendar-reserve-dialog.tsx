import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reservationsApi } from '@/api/reservations.api';
import { paymentMethodsApi } from '@/api/payment-methods.api';
import { surchargeTypesApi } from '@/api/surcharge-types.api';
import { surchargesApi } from '@/api/surcharges.api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { BedDouble, Loader2, CalendarDays, DollarSign, Zap, Plus, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toastSuccess } from '@/lib/notifications';
import { GuestSearch } from '@/components/forms/guest-search';
import Swal from 'sweetalert2';

interface CalendarReserveDialogProps {
  room: any;
  date: string;
  open: boolean;
  onClose: () => void;
}

function addDays(dateStr: string, days: number): string {
  if (!dateStr) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function CalendarReserveDialog({ room, date, open, onClose }: CalendarReserveDialogProps) {
  const qc = useQueryClient();
  const [fechaEntrada, setFechaEntrada] = useState(date || new Date().toISOString().slice(0, 10));
  const [fechaSalida, setFechaSalida] = useState(addDays(date || new Date().toISOString().slice(0, 10), 1));
  const [guestId, setGuestId] = useState('');
  const [pagoMonto, setPagoMonto] = useState(0);
  const [pagoMetodoPagoId, setPagoMetodoPagoId] = useState('');
  const [pagoReferencia, setPagoReferencia] = useState('');
  const [descuento, setDescuento] = useState(0);
  const hoy = new Date().toISOString().slice(0, 10);
  const [recargos, setRecargos] = useState<{ surchargeTypeId: string; descripcion: string; monto: number; cantidad: number }[]>([]);

  const estimatedTotal = useMemo(() => {
    if (!room?.roomType?.precioBase || !fechaEntrada || !fechaSalida) return 0;
    const noches = Math.ceil(
      (new Date(fechaSalida).getTime() - new Date(fechaEntrada).getTime()) / (1000 * 60 * 60 * 24),
    );
    return noches * Number(room.roomType.precioBase);
  }, [room, fechaEntrada, fechaSalida]);

  const totalRecargos = useMemo(() => {
    return recargos.reduce((sum, r) => sum + (r.monto || 0) * (r.cantidad || 1), 0);
  }, [recargos]);

  const totalToPay = useMemo(() => Math.max(0, estimatedTotal + totalRecargos - descuento), [estimatedTotal, totalRecargos, descuento]);

  const { data: surchargeTypes } = useQuery({
    queryKey: ['surcharge-types', 'active'],
    queryFn: () => surchargeTypesApi.findActive(),
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods-active'],
    queryFn: () => paymentMethodsApi.findAllActive(),
  });

  useEffect(() => {
    if (open) {
      const safeDate = date || new Date().toISOString().slice(0, 10);
      setFechaEntrada(safeDate);
      setFechaSalida(addDays(safeDate, 1));
      setGuestId('');
      setPagoMonto(0);
      setPagoMetodoPagoId('');
      setPagoReferencia('');
      setDescuento(0);
      setRecargos([]);
    }
  }, [open, date]);

  const createReservation = useMutation({
    mutationFn: (dto: any) => reservationsApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms', 'calendar'] });
      qc.invalidateQueries({ queryKey: ['reservations'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
      toastSuccess('Reserva creada correctamente');
      onClose();
    },
  });

  const handleSubmit = async () => {
    if (!guestId || !fechaEntrada || !fechaSalida) return;
    if (pagoMonto && pagoMonto > 0 && !pagoMetodoPagoId) {
      await Swal.fire({
        icon: 'warning',
        title: 'Falta el método de pago',
        text: 'Debe seleccionar un método de pago para el anticipo',
        confirmButtonColor: '#ef4444',
      });
      return;
    }

    const result = await Swal.fire({
      title: '¿Crear la reserva?',
      html: `
        <div style="text-align:left;font-size:14px;line-height:1.8">
          <div><strong>Habitación:</strong> ${room.numero} — ${room.nombre}</div>
          <div><strong>Fechas:</strong> ${fechaEntrada} al ${fechaSalida}</div>
          <div><strong>Total a pagar:</strong> ${formatCurrency(totalToPay)}</div>
          ${pagoMonto > 0 ? `<div><strong>Pago ahora:</strong> ${formatCurrency(pagoMonto)}</div>` : ''}
          <div style="margin-top:6px;color:#6b7280">Esta acción no se puede revertir.</div>
        </div>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, crear reserva',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#16a34a',
    });
    if (!result.isConfirmed) return;

    const payload: any = {
      roomId: room.id,
      guestId,
      fechaEntrada,
      fechaSalida,
      cantidadHuespedes: 1,
      estado: 'confirmada',
    };
    if (descuento > 0) {
      payload.descuento = descuento;
    }
    if (pagoMonto && pagoMonto > 0) {
      payload.pagoMonto = pagoMonto;
      payload.pagoMetodoPagoId = pagoMetodoPagoId || undefined;
      payload.pagoReferencia = pagoReferencia || undefined;
    }
    const newReservation = await createReservation.mutateAsync(payload);

    const recargosValidos = recargos.filter((r) => r.monto > 0 && r.descripcion);
    for (const r of recargosValidos) {
      await surchargesApi.create({
        reservationId: newReservation.id,
        surchargeTypeId: r.surchargeTypeId || undefined,
        descripcion: r.descripcion,
        monto: r.monto,
        cantidad: r.cantidad,
      });
    }
  };

  if (!room) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reservar desde Calendario</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <BedDouble className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold">{room.numero} — {room.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {room.roomType?.nombre} — {formatCurrency(room.roomType?.precioBase || 0)}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Entrada</label>
              <div className="relative">
                <CalendarDays className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" type="date" value={fechaEntrada} min={hoy} onChange={(e) => {
                  setFechaEntrada(e.target.value);
                  if (e.target.value >= fechaSalida) {
                    setFechaSalida(addDays(e.target.value, 1));
                  }
                }} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Salida</label>
              <div className="relative">
                <CalendarDays className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" type="date" value={fechaSalida} min={addDays(fechaEntrada, 1)} onChange={(e) => setFechaSalida(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Huésped</label>
            <GuestSearch key={String(open)} onSelect={(id) => setGuestId(id)} />
          </div>

          <div className="rounded-lg border border-violet-200 p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-violet-700">
              <Zap className="h-4 w-4" /> Recargos
            </div>
            {(surchargeTypes || []).length === 0 && recargos.length === 0 && (
              <p className="text-xs text-muted-foreground">No hay tipos de recargo configurados</p>
            )}
            {recargos.map((r, i) => (
              <div key={i} className="flex items-end gap-2 border-b pb-2">
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground">Tipo</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={r.surchargeTypeId}
                    onChange={(e) => {
                      const type = (surchargeTypes || []).find((t: any) => t.id === e.target.value);
                      const updated = [...recargos];
                      updated[i].surchargeTypeId = e.target.value;
                      updated[i].descripcion = type?.nombre || '';
                      updated[i].monto = type ? Number(type.montoDefault) : 0;
                      setRecargos(updated);
                    }}
                  >
                    <option value="">Seleccionar...</option>
                    {(surchargeTypes || []).map((st: any) => (
                      <option key={st.id} value={st.id}>{st.nombre} — {formatCurrency(Number(st.montoDefault))}</option>
                    ))}
                  </select>
                </div>
                <div className="w-20 space-y-1">
                  <label className="text-xs text-muted-foreground">Cant.</label>
                  <Input
                    type="number" min={1}
                    value={r.cantidad}
                    onChange={(e) => {
                      const updated = [...recargos];
                      updated[i].cantidad = Number(e.target.value);
                      setRecargos(updated);
                    }}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground">Monto</label>
                  <Input
                    type="number" step="0.01" min={0}
                    value={r.monto}
                    onChange={(e) => {
                      const updated = [...recargos];
                      updated[i].monto = Number(e.target.value);
                      setRecargos(updated);
                    }}
                  />
                </div>
                <Button type="button" variant="ghost" size="icon" className="mb-0.5" onClick={() => setRecargos(recargos.filter((_, j) => j !== i))}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {(surchargeTypes || []).length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const first = surchargeTypes[0];
                  setRecargos([...recargos, { surchargeTypeId: first.id, descripcion: first.nombre, monto: Number(first.montoDefault), cantidad: 1 }]);
                }}
              >
                <Plus className="mr-1 h-3 w-3" /> Agregar recargo
              </Button>
            )}
          </div>

          <div className="rounded-lg border border-amber-200 p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
              <DollarSign className="h-4 w-4" /> Pago
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded bg-muted p-2 text-center">
                <p className="text-xs text-muted-foreground">Total alojamiento</p>
                <p className="font-bold">{formatCurrency(estimatedTotal)}</p>
              </div>
              <div className="rounded bg-violet-50 p-2 text-center">
                <p className="text-xs text-violet-700">Recargos</p>
                <p className="font-bold text-violet-700">{formatCurrency(totalRecargos)}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs">Descuento</label>
                <Input type="number" min={0} placeholder="0" value={descuento || ''} onChange={(e) => setDescuento(Number(e.target.value))} />
              </div>
              <div className="rounded bg-amber-50 p-2 text-center col-span-2">
                <p className="text-xs text-amber-700">Total a pagar</p>
                <p className="font-bold text-amber-700">{formatCurrency(totalToPay)}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-xs">Monto</label>
                <div className="flex gap-1">
                  <Input type="number" min={0} placeholder="0" value={pagoMonto || ''} onChange={(e) => setPagoMonto(Number(e.target.value))} />
                  <Button type="button" variant="outline" size="sm" className="shrink-0 text-xs" onClick={() => setPagoMonto(totalToPay)}>
                    Todo
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs">Método de pago</label>
                <Select value={pagoMetodoPagoId} placeholder="Seleccionar" options={(paymentMethods || []).map((pm: any) => ({ value: pm.id, label: pm.nombre }))} onChange={(e) => setPagoMetodoPagoId(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs">Referencia</label>
                <Input placeholder="Opcional" value={pagoReferencia} onChange={(e) => setPagoReferencia(e.target.value)} />
              </div>
            </div>
            {pagoMonto > 0 && pagoMonto < totalToPay && (
              <p className="text-xs text-amber-600">Abono parcial — quedan {formatCurrency(totalToPay - pagoMonto)} pendientes</p>
            )}
            {pagoMonto >= totalToPay && totalToPay > 0 && (
              <p className="text-xs text-green-600">Pago completo</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!guestId || !fechaEntrada || !fechaSalida || createReservation.isPending}>
              {createReservation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Crear Reserva
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
