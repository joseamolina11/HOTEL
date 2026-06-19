import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsApi } from '@/api/rooms.api';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RoomForm } from '@/components/forms/room-form';
import { ReservationForm } from '@/components/forms/reservation-form';
import { CheckInDialog } from '@/components/forms/check-in-dialog';
import { Search, Plus, LogIn, LogOut, CalendarCheck, Wrench, Sparkles, X, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const STATUS_ACTIONS: Record<string, { label: string; icon: any; status: string; roles: string[] }[]> = {
  disponible: [
    { label: 'Check-In', icon: LogIn, status: 'ocupada', roles: ['disponible'] },
    { label: 'Reservar', icon: CalendarCheck, status: 'reservada', roles: ['disponible'] },
    { label: 'Mantenimiento', icon: Wrench, status: 'mantenimiento', roles: ['disponible', 'reservada', 'ocupada', 'limpieza'] },
    { label: 'Limpieza', icon: Sparkles, status: 'limpieza', roles: ['disponible', 'reservada', 'ocupada', 'mantenimiento'] },
  ],
  reservada: [
    { label: 'Check-In', icon: LogIn, status: 'ocupada', roles: ['reservada'] },
    { label: 'Mantenimiento', icon: Wrench, status: 'mantenimiento', roles: ['disponible', 'reservada', 'ocupada', 'limpieza'] },
    { label: 'Limpieza', icon: Sparkles, status: 'limpieza', roles: ['disponible', 'reservada', 'ocupada', 'mantenimiento'] },
  ],
  ocupada: [
    { label: 'Tomar Pedido', icon: ShoppingCart, status: 'pedido', roles: ['ocupada'] },
    { label: 'Check-Out', icon: LogOut, status: 'checkout', roles: ['ocupada'] },
    { label: 'Limpieza', icon: Sparkles, status: 'limpieza', roles: ['ocupada'] },
    { label: 'Mantenimiento', icon: Wrench, status: 'mantenimiento', roles: ['disponible', 'reservada', 'ocupada', 'limpieza'] },
  ],
  limpieza: [
    { label: 'Volver a Ocupada', icon: LogIn, status: 'ocupada', roles: ['limpieza'] },
    { label: 'Disponible', icon: Sparkles, status: 'disponible', roles: ['limpieza', 'mantenimiento'] },
    { label: 'Mantenimiento', icon: Wrench, status: 'mantenimiento', roles: ['disponible', 'reservada', 'ocupada', 'limpieza'] },
  ],
  mantenimiento: [
    { label: 'Disponible', icon: Sparkles, status: 'disponible', roles: ['limpieza', 'mantenimiento'] },
    { label: 'Limpieza', icon: Wrench, status: 'limpieza', roles: ['disponible', 'reservada', 'ocupada', 'mantenimiento'] },
  ],
};

export function RoomsListPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [menuRoom, setMenuRoom] = useState<any>(null);
  const [checkInRoom, setCheckInRoom] = useState<any>(null);
  const [reserveRoom, setReserveRoom] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: rooms, isLoading, refetch } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => roomsApi.findAll(),
  });

  const changeStatus = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => roomsApi.changeStatus(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rooms'] }); setMenuRoom(null); },
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuRoom(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredRooms = (rooms || []).filter((r: any) =>
    r.nombre.toLowerCase().includes(filter.toLowerCase()) ||
    r.numero.includes(filter),
  );

  const statusOrder = ['disponible', 'ocupada', 'reservada', 'limpieza', 'mantenimiento'];
  const sortedRooms = [...(filteredRooms || [])].sort(
    (a, b) => statusOrder.indexOf(a.estado) - statusOrder.indexOf(b.estado) || a.piso - b.piso,
  );

  const handleCheckIn = (room: any) => {
    setMenuRoom(null);
    setCheckInRoom(room);
  };

  const handleReserve = (room: any) => {
    setMenuRoom(null);
    setReserveRoom(room);
  };

  const handleCheckOut = (room: any) => {
    setMenuRoom(null);
    navigate(`/check-out?roomId=${room.id}`);
  };

  const handleOrder = (room: any) => {
    setMenuRoom(null);
    navigate(`/orders?roomId=${room.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Habitaciones</h1>
        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar habitación..." className="pl-10" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Nueva Habitación</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nueva Habitación</DialogTitle>
              </DialogHeader>
              <RoomForm onSuccess={() => { setOpen(false); refetch(); }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="h-32 animate-pulse bg-muted rounded-xl" /></Card>
          ))
        ) : sortedRooms.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">Sin habitaciones registradas</div>
        ) : (
          sortedRooms.map((room: any) => (
            <div key={room.id} className="relative">
              <Card
                className="group cursor-pointer transition-all hover:shadow-md"
                onClick={() => setMenuRoom(menuRoom?.id === room.id ? null : room)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-lg font-bold">{room.numero}</p>
                      <p className="text-sm text-muted-foreground">{room.nombre}</p>
                    </div>
                    <StatusBadge status={room.estado} />
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Piso {room.piso}</span>
                    {room.roomType && (
                      <><span>•</span><span>{room.roomType.nombre}</span><span>•</span><span>{formatCurrency(room.roomType.precioBase)}</span></>
                    )}
                  </div>
                </CardContent>
              </Card>

              {menuRoom?.id === room.id && (
                <div
                  ref={menuRef}
                  className="absolute left-0 right-0 top-0 z-50 rounded-xl border bg-card shadow-lg"
                >
                  <div className="flex items-center justify-between border-b px-4 py-2">
                    <span className="text-sm font-semibold">{room.numero} — {room.nombre}</span>
                    <button onClick={() => setMenuRoom(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="p-2 space-y-1">
                    {STATUS_ACTIONS[room.estado]?.map((action) => (
                      <button
                        key={action.status}
                        onClick={() => {
                          if (action.status === 'pedido') { handleOrder(room); return; }
                          if (action.status === 'checkout') { handleCheckOut(room); return; }
                          if (action.status === 'reservada') { handleReserve(room); return; }
                          if (action.status === 'ocupada' && ['disponible', 'reservada'].includes(room.estado)) { handleCheckIn(room); return; }
                          changeStatus.mutate({ id: room.id, dto: { estado: action.status } });
                        }}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                      >
                        <action.icon className="h-4 w-4 text-muted-foreground" />
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <CheckInDialog room={checkInRoom} open={!!checkInRoom} onClose={() => setCheckInRoom(null)} />

      <Dialog open={!!reserveRoom} onOpenChange={(v) => !v && setReserveRoom(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reservar Habitación</DialogTitle>
          </DialogHeader>
          <ReservationForm
            defaultRoomId={reserveRoom?.id}
            onSuccess={() => { setReserveRoom(null); refetch(); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
