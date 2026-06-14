import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationsApi } from '@/api/reservations.api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { BedDouble, Loader2, CalendarDays } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toastSuccess } from '@/lib/notifications';
import { GuestSearch } from '@/components/forms/guest-search';

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
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (open) {
      const safeDate = date || new Date().toISOString().slice(0, 10);
      setFechaEntrada(safeDate);
      setFechaSalida(addDays(safeDate, 1));
      setGuestId('');
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
    await createReservation.mutateAsync({
      roomId: room.id,
      guestId,
      fechaEntrada,
      fechaSalida,
      cantidadHuespedes: 1,
      estado: 'confirmada',
    });
  };

  if (!room) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
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
                <Input className="pl-9" type="date" value={fechaEntrada} min={today} onChange={(e) => {
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
