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
import { ChangeRoomDialog } from '@/components/forms/change-room-dialog';
import { Search, Plus, LogIn, LogOut, CalendarCheck, Wrench, Sparkles, X, ShoppingCart, CalendarClock, User, ArrowRightLeft, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const STATUS_ACTIONS: Record<string, { label: string; icon: any; status: string; roles: string[] }[]> = {
  disponible: [
    { label: 'Check-In Directo', icon: LogIn, status: 'ocupada', roles: ['disponible'] },
    // { label: 'Reservar', icon: CalendarCheck, status: 'reservada', roles: ['disponible'] },
    { label: 'Mantenimiento', icon: Wrench, status: 'mantenimiento', roles: ['disponible', 'reservada', 'ocupada', 'limpieza'] },
    { label: 'Limpieza', icon: Sparkles, status: 'limpieza', roles: ['disponible', 'reservada', 'ocupada', 'mantenimiento'] },
  ],
  reservada: [
    { label: 'Check-In Directo', icon: LogIn, status: 'ocupada', roles: ['reservada'] },
    { label: 'Mantenimiento', icon: Wrench, status: 'mantenimiento', roles: ['disponible', 'reservada', 'ocupada', 'limpieza'] },
    { label: 'Limpieza', icon: Sparkles, status: 'limpieza', roles: ['disponible', 'reservada', 'ocupada', 'mantenimiento'] },
  ],
  ocupada: [
    { label: 'Tomar Pedido', icon: ShoppingCart, status: 'pedido', roles: ['ocupada'] },
    { label: 'Check-Out', icon: LogOut, status: 'checkout', roles: ['ocupada'] },
    { label: 'Cambiar Habitación', icon: ArrowRightLeft, status: 'cambiar', roles: ['ocupada'] },
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
  const [changeRoomReservation, setChangeRoomReservation] = useState<any>(null);
  const [occOpen, setOccOpen] = useState(false);
  const [occDesde, setOccDesde] = useState(() => toDateKey(new Date()));
  const [occHasta, setOccHasta] = useState(() => toDateKey(new Date()));
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

  const byNumber = (a: any, b: any) =>
    (Number(a.numero) || 0) - (Number(b.numero) || 0) ||
    String(a.numero).localeCompare(String(b.numero));

  const floors: number[] = [...new Set((filteredRooms as any[]).map((r) => r.piso))].sort((a, b) => a - b);
  const roomsByFloor = (piso: number) =>
    (filteredRooms || []).filter((r: any) => r.piso === piso).sort(byNumber);

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

  const handleChangeRoom = (room: any) => {
    setMenuRoom(null);
    const res = {
      id: room.reservationId || room.id,
      roomId: room.id,
      roomNombre: `${room.numero} — ${room.nombre}`,
      fechaEntrada: room.fechaEntrada || '',
      fechaSalida: room.fechaSalida || '',
      estado: 'checkin',
    };
    setChangeRoomReservation(res);
  };

  const handleOccupancyPdf = async () => {
    const { printOccupancyControl } = await import('@/lib/print-document');
    printOccupancyControl({ desde: occDesde, hasta: occHasta });
    setOccOpen(false);
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

          <Button variant="outline" onClick={() => setOccOpen(true)}>
            <FileText className="mr-2 h-4 w-4" /> Control de Ocupación
          </Button>
        </div>
      </div>

      <Dialog open={occOpen} onOpenChange={setOccOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Control de Ocupación</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Genera el PDF con todas las habitaciones y su estado (ocupada / vacía),
            el último check-out y, si está ocupada, el total pagado y el saldo pendiente de la reserva.
            Las fechas son opcionales y filtran el último check-out por período.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Desde</span>
              <Input type="date" value={occDesde} onChange={(e) => setOccDesde(e.target.value)} className="w-40" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Hasta</span>
              <Input type="date" value={occHasta} onChange={(e) => setOccHasta(e.target.value)} className="w-40" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOccOpen(false)}>Cancelar</Button>
            <Button onClick={handleOccupancyPdf}>
              <FileText className="mr-2 h-4 w-4" /> Generar PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-8">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}><CardContent className="h-32 animate-pulse bg-muted rounded-xl" /></Card>
            ))}
          </div>
        ) : floors.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">Sin habitaciones registradas</div>
        ) : (
          floors.map((piso) => (
            <section key={piso}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-lg font-semibold">Piso {piso}</h2>
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">{roomsByFloor(piso).length} habitaciones</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {roomsByFloor(piso).map((room: any) => (
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
                            <div className="flex items-center gap-2">
                              {room.tieneReservaManana && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                                  <CalendarClock className="h-3 w-3" />
                                  Mañana
                                </span>
                              )}
                              <StatusBadge status={room.estado} />
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Piso {room.piso}</span>
                            {room.roomType && (
                              <><span>•</span><span>{room.roomType.nombre}</span><span>•</span><span>{formatCurrency(room.roomType.precioBase)}</span></>
                            )}
                          </div>
                          {room.huesped && (
                            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-xs dark:border-blue-900 dark:bg-blue-950/30">
                              <div className="flex items-center gap-1.5 font-medium text-blue-700 dark:text-blue-300">
                                <User className="h-3.5 w-3.5" />
                                {room.huesped}
                              </div>
                              <div className="mt-2 flex justify-between text-muted-foreground">
                                <span>Pagado:</span>
                                <span className="font-medium text-foreground">{formatCurrency(room.totalPagado)}</span>
                              </div>
                              <div className="flex justify-between text-muted-foreground">
                                <span>Debe:</span>
                                <span className={`font-medium ${room.saldoPendiente > 0 ? 'text-destructive' : 'text-green-600'}`}>
                                  {formatCurrency(room.saldoPendiente)}
                                </span>
                              </div>
                            </div>
                          )}
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
                                if (action.status === 'cambiar') { handleChangeRoom(room); return; }
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
                ))}
              </div>
            </section>
          ))
        )}
      </div>
      <ChangeRoomDialog
        open={!!changeRoomReservation}
        onClose={() => setChangeRoomReservation(null)}
        reservation={changeRoomReservation || { id: '', roomId: '', fechaEntrada: '', fechaSalida: '', estado: '' }}
      />

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
