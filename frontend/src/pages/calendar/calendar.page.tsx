import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, addWeeks, subMonths, subWeeks,
  isSameMonth, isToday, parseISO,
  startOfDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { roomsApi } from '@/api/rooms.api';
import { roomTypesApi } from '@/api/room-types.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarReserveDialog } from '@/components/forms/calendar-reserve-dialog';
import { ChevronLeft, ChevronRight, CalendarDays, CalendarRange, Filter } from 'lucide-react';

type ViewMode = 'month' | 'week';

const STATUS_CLASSES: Record<string, string> = {
  disponible: 'bg-green-50 hover:bg-green-100 cursor-pointer',
  reservada: 'bg-yellow-50 hover:bg-yellow-100 cursor-pointer',
  confirmada: 'bg-yellow-50 hover:bg-yellow-100 cursor-pointer',
  ocupada: 'bg-red-50',
  limpieza: 'bg-blue-50',
  mantenimiento: 'bg-gray-100',
  checkout: 'bg-green-50 hover:bg-green-100 cursor-pointer',
};

const STATUS_LABELS: Record<string, string> = {
  disponible: 'Disp',
  reservada: 'Res',
  ocupada: 'Ocup',
  limpieza: 'Limp',
  mantenimiento: 'Mant',
  checkout: 'Sale',
};

function getCellStatus(room: any, date: Date): string | null {
  if (room.estado === 'mantenimiento') return 'mantenimiento';
  if (room.estado === 'limpieza') return 'limpieza';

  const dayStart = date;
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const active = (room.reservations || []).find((r: any) => {
    const rStart = parseISO(r.fechaEntrada);
    const rEnd = parseISO(r.fechaSalida);
    return rStart < dayEnd && rEnd > dayStart;
  });

  if (active) {
    if (active.estado === 'checkin') return 'ocupada';
    return 'reservada';
  }

  const salida = (room.reservations || []).find((r: any) => {
    const rEnd = parseISO(r.fechaSalida);
    return rEnd.getTime() === dayStart.getTime();
  });

  if (salida) return 'checkout';

  return 'disponible';
}

function getCellGuest(room: any, date: Date): string {
  const dayStart = date;
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const active = (room.reservations || []).find((r: any) => {
    const rStart = parseISO(r.fechaEntrada);
    const rEnd = parseISO(r.fechaSalida);
    return rStart < dayEnd && rEnd > dayStart;
  });
  if (active) return active?.guest?.nombres || '';
  const salida = (room.reservations || []).find((r: any) => {
    const rEnd = parseISO(r.fechaSalida);
    return rEnd.getTime() === dayStart.getTime();
  });
  return salida?.guest?.nombres || '';
}

export function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reserveCell, setReserveCell] = useState<{ room: any; date: string } | null>(null);
  const [filterRoomType, setFilterRoomType] = useState('');
  const [filterCapacidad, setFilterCapacidad] = useState('');

  const { fechaInicio, fechaFin, days } = useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
      const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
      const days = eachDayOfInterval({ start: calStart, end: calEnd });
      return {
        fechaInicio: format(calStart, 'yyyy-MM-dd'),
        fechaFin: format(calEnd, 'yyyy-MM-dd'),
        days,
      };
    }
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    return {
      fechaInicio: format(weekStart, 'yyyy-MM-dd'),
      fechaFin: format(weekEnd, 'yyyy-MM-dd'),
      days,
    };
  }, [viewMode, currentDate]);

  const { data: roomsData, isLoading } = useQuery({
    queryKey: ['rooms', 'calendar', fechaInicio, fechaFin],
    queryFn: () => roomsApi.getCalendar(fechaInicio, fechaFin),
  });

  const { data: roomTypesResponse } = useQuery({
    queryKey: ['room-types'],
    queryFn: () => roomTypesApi.findAll(),
  });

  const roomTypes = roomTypesResponse?.data?.data || [];

  const allRooms: any[] = Array.isArray(roomsData) ? roomsData : [];

  const rooms = useMemo(() => {
    return allRooms.filter((r: any) => {
      if (filterRoomType && r.roomType?.id !== filterRoomType) return false;
      if (filterCapacidad) {
        const cap = parseInt(filterCapacidad, 10);
        const totalCap = (r.roomType?.capacidadAdultos || 0) + (r.roomType?.capacidadNinos || 0);
        if (totalCap < cap) return false;
      }
      return true;
    });
  }, [allRooms, filterRoomType, filterCapacidad]);

  const prev = () => {
    setCurrentDate(viewMode === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1));
  };

  const next = () => {
    setCurrentDate(viewMode === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1));
  };

  const title =
    viewMode === 'month'
      ? format(currentDate, 'MMMM yyyy', { locale: es })
      : `Semana del ${format(days[0], "d 'de' MMMM", { locale: es })}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendario de Habitaciones</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Hoy
          </Button>
          <Button variant="ghost" size="icon" onClick={prev}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="min-w-[200px] text-center font-semibold capitalize">{title}</span>
          <Button variant="ghost" size="icon" onClick={next}>
            <ChevronRight className="h-5 w-5" />
          </Button>
          <div className="ml-4 flex rounded-lg border">
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
              className="rounded-r-none"
            >
              <CalendarDays className="mr-1 h-4 w-4" /> Mes
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="rounded-l-none"
            >
              <CalendarRange className="mr-1 h-4 w-4" /> Semana
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-green-100 border border-green-300" /> Disponible</span>
              <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-yellow-100 border border-yellow-300" /> Reservada</span>
              <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-red-100 border border-red-300" /> Ocupada</span>
              <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-blue-100 border border-blue-300" /> Limpieza</span>
              <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-gray-100 border border-gray-300" /> Mantenimiento</span>
              <span className="flex items-center gap-1 relative"><span className="inline-block h-3 w-3 rounded bg-green-100 border border-green-300" /><span className="absolute left-0.5 top-0.5 text-[6px] font-bold text-green-700">S</span> Sale (disponible)</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                className="flex h-9 w-56 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={filterRoomType}
                onChange={(e) => setFilterRoomType(e.target.value)}
              >
                <option value="">Todos los tipos</option>
                {(roomTypes || []).map((rt: any) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.nombre} — Cap. {rt.capacidadAdultos+rt.capacidadNinos} | {Number(rt.precioBase).toFixed(0)} USD
                  </option>
                ))}
              </select>
              <Input
                type="number"
                min={1}
                placeholder="Capacidad mín."
                value={filterCapacidad}
                onChange={(e) => setFilterCapacidad(e.target.value)}
                className="w-28"
              />
              {(filterRoomType || filterCapacidad) && (
                <Button variant="ghost" size="sm" onClick={() => { setFilterRoomType(''); setFilterCapacidad(''); }}>
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-auto">
        <div className="min-w-[700px]">
          {/* Header row: room label + day columns */}
          <div className="grid sticky top-0 z-20 bg-background" style={{ gridTemplateColumns: `130px repeat(${days.length}, minmax(90px, 1fr))` }}>
            <div className="border-b p-2" />
            {days.filter((d) => startOfDay(new Date(d)) >= startOfDay(new Date())).map((d, i) => (
              <div
                key={i}
                className={`border-b border-r p-1.5 text-center text-xs ${
                  isToday(d) ? 'bg-primary/10 text-primary font-bold' : ''
                } ${!isSameMonth(d, currentDate) && viewMode === 'month' ? 'text-muted-foreground' : ''}`}
              >
                <div>{format(d, 'EEE', { locale: es })}</div>
                <div className="text-sm">{format(d, 'd')}</div>
              </div>
            ))}
          </div>

          {/* Room rows */}
          {rooms.length === 0 && isLoading && (
            <div className="py-12 text-center text-muted-foreground">Cargando...</div>
          )}
          {rooms.length === 0 && !isLoading && (
            <div className="py-12 text-center text-muted-foreground">Sin habitaciones registradas</div>
          )}

          {rooms.map((room: any) => (
            <div key={room.id} className="grid" style={{ gridTemplateColumns: `130px repeat(${days.length}, minmax(90px, 1fr))` }}>
              <div className="sticky left-0 z-10 bg-background border-b p-2 text-sm font-medium flex items-center gap-2 truncate">
                <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{
                  backgroundColor: room.roomType?.colorIdentificador || '#3B82F6',
                }} />
                <span className="shrink-0">{room.numero}</span>
                <span className="text-muted-foreground text-xs truncate">{room.nombre}</span>
              </div>
              {days.filter((d) => startOfDay(new Date(d)) >= startOfDay(new Date())).map((d, di) => {
                const status = !isSameMonth(d, currentDate) && viewMode === 'month' ? null : getCellStatus(room, d);
                const today = isToday(d);
                const guestName = (status === 'reservada' || status === 'checkout') ? getCellGuest(room, d) : '';
                return (
                  <div
                    key={di}
                    style={{
                      cursor: (status === 'disponible' || status === 'checkout') ? 'pointer' : 'no-drop',
                    }}
                    className={`border-b border-r p-1 min-h-[52px] transition-colors text-xs
                      ${status ? STATUS_CLASSES[status] || '' : 'bg-muted/30'}
                      ${today ? 'ring-2 ring-inset ring-primary/30' : ''}
                    `}
                    onClick={() => {
                      if (status === 'disponible' ||  status === 'checkout') {
                        setReserveCell({ room, date: format(d, 'yyyy-MM-dd') });
                      }
                    }}
                    title={status ? `${room.numero} ${format(d, 'yyyy-MM-dd')}: ${status}` : ''}
                  >
                    <div className="flex flex-col items-center justify-center h-full ">
                      <span className="text-[10px] font-semibold uppercase">{STATUS_LABELS[status || ''] || ''}</span>
                      {guestName && (
                        <span className="text-[8px] text-muted-foreground truncate max-w-full leading-tight mt-0.5">
                          {status === 'checkout' && <span className="text-green-600 mr-0.5">↳</span>}
                          {guestName}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <CalendarReserveDialog
        room={reserveCell?.room}
        date={reserveCell?.date || ''}
        open={!!reserveCell}
        onClose={() => setReserveCell(null)}
      />
    </div>
  );
}
