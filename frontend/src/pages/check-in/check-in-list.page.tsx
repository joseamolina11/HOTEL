import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationsApi } from '@/api/reservations.api';
import { guestsApi } from '@/api/guests.api';
import apiClient from '@/api/client';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { LogIn, Plus, X, Loader2 } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';
import { toastSuccess } from '@/lib/notifications';

export function CheckInListPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['reservations', { estado: 'confirmada' }],
    queryFn: () => reservationsApi.findAll({ estado: 'confirmada' }),
  });

  const { data: todayData } = useQuery({
    queryKey: ['reservations-today'],
    queryFn: () => reservationsApi.findToday(),
  });

  const reservations = data?.data?.data || [];
  const todayArrivals = todayData?.arrivals || [];

  const onSuccess = () => {
    qc.invalidateQueries({ queryKey: ['reservations'] });
    qc.invalidateQueries({ queryKey: ['reservations-today'] });
    qc.invalidateQueries({ queryKey: ['rooms'] });
    qc.invalidateQueries({ queryKey: ['guests'] });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Check-In</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Llegadas del Día</CardTitle>
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
                {todayArrivals.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Sin llegadas programadas para hoy
                  </td></tr>
                ) : (
                  todayArrivals.map((res: any) => (
                    <ProcessCheckInRow key={res.id} reservation={res} onSuccess={onSuccess} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Reservas Confirmadas</CardTitle>
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
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                  <th className="px-4 py-3 text-center font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                ) : reservations.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Sin reservas confirmadas pendientes
                  </td></tr>
                ) : (
                  reservations.map((res: any) => (
                    <ProcessCheckInRow key={res.id} reservation={res} onSuccess={onSuccess} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProcessCheckInRow({ reservation, onSuccess }: { reservation: any; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [companions, setCompanions] = useState<{
    nombres: string; apellidos: string; documento: string;
    nacionalidad: string; telefono: string; email: string;
  }[]>([]);
  const [observaciones, setObservaciones] = useState('');

  const checkInMut = useMutation({
    mutationFn: (dto: { reservationId: string; observaciones?: string; companions?: any[] }) =>
      apiClient.post('/check-in', dto),
    onSuccess: () => {
      toastSuccess('Check-In realizado correctamente');
      onSuccess();
      setOpen(false);
      setCompanions([]);
      setObservaciones('');
    },
  });

  const addCompanion = () => {
    setCompanions([...companions, { nombres: '', apellidos: '', documento: '', nacionalidad: '', telefono: '', email: '' }]);
  };

  const updateCompanion = (index: number, field: string, value: string) => {
    const updated = [...companions];
    (updated[index] as any)[field] = value;
    setCompanions(updated);
  };

  const removeCompanion = (index: number) => {
    setCompanions(companions.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    const companionsList = companions.filter((c) => c.documento);
    checkInMut.mutate({
      reservationId: reservation.id,
      observaciones,
      companions: companionsList.length > 0 ? companionsList : undefined,
    });
  };

  const isPending = checkInMut.isPending;

  return (
    <>
      <tr className="border-b hover:bg-muted/50">
        <td className="px-4 py-3 font-medium">{reservation.codigo}</td>
        <td className="px-4 py-3">{reservation.guest?.nombres} {reservation.guest?.apellidos}</td>
        <td className="px-4 py-3">{reservation.room?.nombre}</td>
        <td className="px-4 py-3">{formatDateShort(reservation.fechaEntrada)}</td>
        <td className="px-4 py-3">{formatDateShort(reservation.fechaSalida)}</td>
        <td className="px-4 py-3"><StatusBadge status={reservation.estado} /></td>
        <td className="px-4 py-3 text-center">
          <Button size="sm" onClick={() => setOpen(true)} disabled={reservation.estado !== 'confirmada'}>
            <LogIn className="mr-1 h-3 w-3" /> Procesar
          </Button>
        </td>
      </tr>

      <Dialog open={open} onOpenChange={(v) => { if (!v && !isPending) { setOpen(false); setCompanions([]); setObservaciones(''); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" /> Procesar Check-In
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reserva</span>
                <span className="font-medium">{reservation.codigo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Huésped</span>
                <span className="font-medium">{reservation.guest?.nombres} {reservation.guest?.apellidos}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Habitación</span>
                <span>{reservation.room?.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Período</span>
                <span>{formatDateShort(reservation.fechaEntrada)} — {formatDateShort(reservation.fechaSalida)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Acompañantes</label>
                <Button type="button" variant="outline" size="sm" onClick={addCompanion}>
                  <Plus className="mr-1 h-3 w-3" /> Agregar
                </Button>
              </div>
              {companions.map((c, i) => (
                <CompanionCard
                  key={i}
                  index={i}
                  companion={c}
                  onChange={updateCompanion}
                  onRemove={removeCompanion}
                />
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Observaciones</label>
              <Input placeholder="Opcional" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            </div>

            <div className="flex gap-3">
              <DialogClose asChild>
                <Button variant="outline" className="flex-1" disabled={isPending}>Cancelar</Button>
              </DialogClose>
              <Button
                className="flex-1"
                disabled={isPending}
                onClick={handleConfirm}
              >
                {isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
                ) : (
                  <><LogIn className="mr-2 h-4 w-4" /> Confirmar Check-In</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CompanionCard({
  index,
  companion,
  onChange,
  onRemove,
}: {
  index: number;
  companion: any;
  onChange: (i: number, field: string, value: string) => void;
  onRemove: (i: number) => void;
}) {
  const [searching, setSearching] = useState(false);

  const handleDocBlur = useCallback(async () => {
    const doc = companion.documento;
    if (!doc || doc.length < 3) return;
    setSearching(true);
    try {
      const existing = (await guestsApi.findAll(doc))?.data?.data || [];
      if (existing.length > 0) {
        const g = existing[0];
        onChange(index, 'nombres', g.nombres);
        onChange(index, 'apellidos', g.apellidos);
        onChange(index, 'nacionalidad', g.nacionalidad);
        if (g.telefono) onChange(index, 'telefono', g.telefono);
        if (g.email) onChange(index, 'email', g.email || '');
      }
    } finally {
      setSearching(false);
    }
  }, [index, companion.documento, onChange]);

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Acompañante #{index + 1}</span>
        <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(index)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Nombres</label>
          <Input placeholder="Nombres" value={companion.nombres} onChange={(e) => onChange(index, 'nombres', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Apellidos</label>
          <Input placeholder="Apellidos" value={companion.apellidos} onChange={(e) => onChange(index, 'apellidos', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Documento</label>
          <div className="relative">
            <Input placeholder="Cédula / Pasaporte" value={companion.documento} onChange={(e) => onChange(index, 'documento', e.target.value)} onBlur={handleDocBlur} />
            {searching && <Loader2 className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-muted-foreground" />}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Nacionalidad</label>
          <Input placeholder="Nacionalidad" value={companion.nacionalidad} onChange={(e) => onChange(index, 'nacionalidad', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Teléfono</label>
          <Input placeholder="Teléfono" value={companion.telefono} onChange={(e) => onChange(index, 'telefono', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Email</label>
          <Input placeholder="Email" value={companion.email} onChange={(e) => onChange(index, 'email', e.target.value)} />
        </div>
      </div>
    </div>
  );
}
