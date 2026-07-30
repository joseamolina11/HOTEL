import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsApi } from '@/api/rooms.api';
import { reservationsApi } from '@/api/reservations.api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRightLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toastSuccess } from '@/lib/notifications';

interface ChangeRoomDialogProps {
  open: boolean;
  onClose: () => void;
  reservation: {
    id: string;
    roomId: string;
    roomNombre?: string;
    fechaEntrada: string;
    fechaSalida: string;
    estado: string;
  };
}

export function ChangeRoomDialog({ open, onClose, reservation }: ChangeRoomDialogProps) {
  const qc = useQueryClient();
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');

  useEffect(() => {
    if (open) setSelectedRoomId('');
  }, [open]);

  const isCheckin = reservation.estado === 'checkin';

  const fechaEntrada = reservation.fechaEntrada?.slice(0, 10);
  const fechaSalida = reservation.fechaSalida?.slice(0, 10);

  const { data: rooms, isLoading } = useQuery({
    queryKey: isCheckin ? ['rooms'] : ['rooms', 'available', fechaEntrada, fechaSalida],
    queryFn: () =>
      isCheckin
        ? roomsApi.findAll()
        : roomsApi.findAvailable(fechaEntrada, fechaSalida),
    enabled: open && (isCheckin || (!!fechaEntrada && !!fechaSalida)),
  });

  const changeRoomMut = useMutation({
    mutationFn: () => reservationsApi.changeRoom(reservation.id, selectedRoomId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['rooms', 'available'] });
      toastSuccess('Habitación cambiada exitosamente');
      onClose();
    },
  });

  const availableRooms = (rooms || []).filter((r: any) => {
    if (r.id === reservation.roomId) return false;
    if (isCheckin) return r.estado === 'disponible';
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" /> Cambiar Habitación
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Habitación actual: <span className="font-medium text-foreground">{reservation.roomNombre || reservation.roomId}</span>
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : availableRooms.length === 0 ? (
            <p className="text-sm text-destructive">No hay habitaciones disponibles para cambiar.</p>
          ) : (
            <div className="grid gap-2 max-h-64 overflow-y-auto pr-1">
              {availableRooms.map((room: any) => {
                const isSelected = selectedRoomId === room.id;
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`flex items-center justify-between rounded-lg border p-3 text-left text-sm transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <div>
                      <span className="font-medium">{room.numero}</span>
                      <span className="ml-2 text-muted-foreground">{room.nombre}</span>
                      {room.roomType && (
                        <span className="ml-2 text-xs text-muted-foreground">({room.roomType.nombre})</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {room.roomType && formatCurrency(room.roomType.precioBase)}
                      {!isCheckin && <span className="ml-1">/noche</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">Cancelar</Button>
            </DialogClose>
            <Button
              className="flex-1"
              disabled={!selectedRoomId || changeRoomMut.isPending}
              onClick={() => changeRoomMut.mutate()}
            >
              {changeRoomMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRightLeft className="mr-2 h-4 w-4" />
              )}
              Cambiar Habitación
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}