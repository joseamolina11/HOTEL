import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  dashboardGerencialApi, CalendarData, CalendarEvent,
  CalendarReservation, CalendarRoom, EventPayload,
} from '@/api/dashboard-gerencial.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GerenciaNav } from '@/components/gerencia/gerencia-nav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { toastSuccess, confirmAction } from '@/lib/notifications';
import { formatDate, formatDateShort, getStatusColor, getStatusLabel, formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  CalendarRange, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Loader2,
  CalendarCheck, CalendarX, Users, BedDouble, DoorOpen, Eye,
} from 'lucide-react';

const DAILY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const TIPO_EVENTO: Record<string, { label: string; color: string }> = {
  evento: { label: 'Evento', color: '#6366f1' },
  mantenimiento: { label: 'Mantenimiento', color: '#f59e0b' },
  feriado: { label: 'Feriado', color: '#ef4444' },
  otro: { label: 'Otro', color: '#10b981' },
};

const ROOM_STATE: Record<string, string> = {
  disponible: 'bg-emerald-500',
  ocupada: 'bg-red-500',
  reservada: 'bg-amber-500',
  limpieza: 'bg-sky-500',
  mantenimiento: 'bg-purple-500',
};

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

type ViewMode = 'mes' | 'semana' | 'dia' | 'habitaciones';

export function CalendarGerencialPage() {
  const qc = useQueryClient();
  const [mode, setMode] = useState<ViewMode>('mes');
  const [selected, setSelected] = useState<Date>(startOfDay(new Date()));

  const range = useMemo(() => {
    const start = startOfDay(selected);
    if (mode === 'mes' || mode === 'habitaciones') {
      const first = new Date(start.getFullYear(), start.getMonth(), 1);
      const last = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      return { inicio: toKey(first), fin: toKey(last) };
    }
    if (mode === 'semana') {
      const monday = addDays(start, -((start.getDay() + 6) % 7));
      return { inicio: toKey(monday), fin: toKey(addDays(monday, 6)) };
    }
    return { inicio: toKey(start), fin: toKey(start) };
  }, [mode, selected]);

  const { data, isLoading } = useQuery<CalendarData>({
    queryKey: ['dashboard-gerencial', 'calendar', range.inicio, range.fin],
    queryFn: () => dashboardGerencialApi.getCalendar(range.inicio, range.fin),
  });
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['dashboard-gerencial', 'calendar'] });
    qc.invalidateQueries({ queryKey: ['dashboard-gerencial', 'summary'] });
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  const createMut = useMutation({
    mutationFn: (payload: EventPayload) => dashboardGerencialApi.createEvent(payload),
    onSuccess: () => { toastSuccess('Evento creado'); setEventOpen(false); resetEventForm(); invalidate(); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<EventPayload> }) => dashboardGerencialApi.updateEvent(id, payload),
    onSuccess: () => { toastSuccess('Evento actualizado'); setEventOpen(false); resetEventForm(); invalidate(); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => dashboardGerencialApi.deleteEvent(id),
    onSuccess: () => { toastSuccess('Evento eliminado'); setEventOpen(false); resetEventForm(); invalidate(); },
  });

  // Event form state
  const [eventOpen, setEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [evTitulo, setEvTitulo] = useState('');
  const [evDescripcion, setEvDescripcion] = useState('');
  const [evFecha, setEvFecha] = useState(toKey(new Date()));
  const [evHoraInicio, setEvHoraInicio] = useState('');
  const [evHoraFin, setEvHoraFin] = useState('');
  const [evTipo, setEvTipo] = useState<EventPayload['tipo']>('evento');
  const [evColor, setEvColor] = useState('');

  const resetEventForm = () => {
    setEditingEvent(null);
    setEvTitulo('');
    setEvDescripcion('');
    setEvFecha(toKey(new Date()));
    setEvHoraInicio('');
    setEvHoraFin('');
    setEvTipo('evento');
    setEvColor('');
  };

  const openNewEvent = (date?: Date) => {
    resetEventForm();
    if (date) setEvFecha(toKey(date));
    setEventOpen(true);
  };

  const openEditEvent = (e: CalendarEvent) => {
    setEditingEvent(e);
    setEvTitulo(e.titulo);
    setEvDescripcion(e.descripcion ?? '');
    setEvFecha(e.fecha);
    setEvHoraInicio(e.horaInicio ?? '');
    setEvHoraFin(e.horaFin ?? '');
    setEvTipo(e.tipo);
    setEvColor(e.color ?? '');
    setEventOpen(true);
  };

  const handleEventSubmit = () => {
    const payload: EventPayload = {
      titulo: evTitulo,
      descripcion: evDescripcion || undefined,
      fecha: evFecha,
      horaInicio: evHoraInicio || undefined,
      horaFin: evHoraFin || undefined,
      tipo: evTipo,
      color: evColor || undefined,
    };
    if (editingEvent) {
      updateMut.mutate({ id: editingEvent.id, payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const handleEventDelete = async () => {
    if (!editingEvent) return;
    const res = await confirmAction('Eliminar evento', `¿Eliminar "${editingEvent.titulo}"?`);
    if (res.isConfirmed) deleteMut.mutate(editingEvent.id);
  };

  const today = startOfDay(new Date());
  const isToday = toKey(selected) === toKey(today);

  const move = (dir: number) => {
    if (mode === 'dia') setSelected(addDays(selected, dir));
    else if (mode === 'semana') setSelected(addDays(selected, 7 * dir));
    else setSelected(new Date(selected.getFullYear(), selected.getMonth() + dir, 1));
  };

  const title = useMemo(() => {
    if (mode === 'dia') return formatDate(selected);
    if (mode === 'semana') {
      const monday = addDays(selected, -((selected.getDay() + 6) % 7));
      return `${formatDateShort(monday)} — ${formatDateShort(addDays(monday, 6))}`;
    }
    return `${MONTHS[selected.getMonth()]} ${selected.getFullYear()}`;
  }, [mode, selected]);

  return (
    <div className="space-y-4 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <CalendarRange className="h-6 w-6" /> Calendario Gerencial
          </h1>
          <p className="text-sm text-muted-foreground">Llegadas, salidas, en casa, habitaciones y eventos.</p>
        </div>
        <Button onClick={() => openNewEvent(mode === 'dia' || mode === 'semana' ? selected : undefined)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Evento
        </Button>
      </div>

      <GerenciaNav />

      {/* Controles */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 py-3">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => move(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={isToday && mode === 'dia' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelected(today)}
            >
              Hoy
            </Button>
            <Button variant="outline" size="icon" onClick={() => move(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm font-semibold">{title}</p>
          <div className="ml-auto flex flex-wrap overflow-hidden rounded-lg border">
            {(['mes', 'semana', 'dia', 'habitaciones'] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm',
                  mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {m === 'mes' ? 'Mes' : m === 'semana' ? 'Semana' : m === 'dia' ? 'Día' : 'Habitaciones'}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Cargando calendario...</CardContent></Card>
      ) : (
        <>
          {mode === 'mes' && <MonthView data={data!} selected={selected} onSelectDay={setSelected} onNewEvent={openNewEvent} onEditEvent={openEditEvent} />}
          {mode === 'semana' && <WeekView data={data!} selected={selected} onSelectDay={setSelected} onEditEvent={openEditEvent} />}
          {mode === 'dia' && <DayView data={data!} selected={selected} onNewEvent={openNewEvent} onEditEvent={openEditEvent} />}
          {mode === 'habitaciones' && <RoomTimelineView data={data!} selected={selected} onSelectDay={setSelected} />}
        </>
      )}

      {/* Dialog evento */}
      <Dialog open={eventOpen} onOpenChange={(v) => { setEventOpen(v); if (!v) resetEventForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Editar Evento' : 'Nuevo Evento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium">Título *</label>
              <Input value={evTitulo} onChange={(e) => setEvTitulo(e.target.value)} placeholder="Ej: Evento corporativo" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Fecha *</label>
              <Input type="date" value={evFecha} onChange={(e) => setEvFecha(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Hora inicio</label>
                <Input type="time" value={evHoraInicio} onChange={(e) => setEvHoraInicio(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Hora fin</label>
                <Input type="time" value={evHoraFin} onChange={(e) => setEvHoraFin(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Tipo</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={evTipo}
                  onChange={(e) => setEvTipo(e.target.value as EventPayload['tipo'])}
                >
                  {Object.entries(TIPO_EVENTO).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Color</label>
                <div className="flex h-9 items-center gap-2 rounded-md border border-input px-3">
                  <input
                    type="color"
                    value={evColor || TIPO_EVENTO[evTipo ?? 'evento'].color}
                    onChange={(e) => setEvColor(e.target.value)}
                    className="h-6 w-6 cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span className="text-xs text-muted-foreground">{evColor || 'Automático'}</span>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Descripción</label>
              <Textarea rows={3} value={evDescripcion} onChange={(e) => setEvDescripcion(e.target.value)} placeholder="Opcional" />
            </div>
            <div className="flex justify-end gap-2">
              {editingEvent && (
                <Button variant="destructive" onClick={handleEventDelete} disabled={deleteMut.isPending}>
                  {deleteMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Eliminar
                </Button>
              )}
              <DialogClose asChild>
                <Button variant="outline" onClick={resetEventForm}>Cancelar</Button>
              </DialogClose>
              <Button
                onClick={handleEventSubmit}
                disabled={!evTitulo || !evFecha || createMut.isPending || updateMut.isPending}
              >
                {(createMut.isPending || updateMut.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingEvent ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------- Helpers ----------

function eventsOn(events: CalendarEvent[], key: string) {
  return events.filter((e) => e.fecha === key);
}

function arrivalsOn(reservations: CalendarReservation[], day: Date) {
  const from = day.getTime();
  const to = day.getTime() + DAILY_MS;
  return reservations.filter(
    (r) => r.estado === 'confirmada' && new Date(r.fechaEntrada).getTime() >= from && new Date(r.fechaEntrada).getTime() < to,
  );
}

function departuresOn(reservations: CalendarReservation[], day: Date) {
  const from = day.getTime();
  const to = day.getTime() + DAILY_MS;
  return reservations.filter(
    (r) => r.estado === 'checkin' && new Date(r.fechaSalida).getTime() >= from && new Date(r.fechaSalida).getTime() < to,
  );
}

function inHouseOn(reservations: CalendarReservation[], day: Date) {
  const from = day.getTime();
  const to = day.getTime() + DAILY_MS;
  return reservations.filter(
    (r) => r.estado === 'checkin' && new Date(r.fechaEntrada).getTime() < to && new Date(r.fechaSalida).getTime() > from,
  );
}

function guestName(r: CalendarReservation) {
  return r.guest ? `${r.guest.nombres} ${r.guest.apellidos}` : r.codigo;
}

// ---------- Vistas ----------

function MonthView({ data, selected, onSelectDay, onNewEvent, onEditEvent }: {
  data: CalendarData;
  selected: Date;
  onSelectDay: (d: Date) => void;
  onNewEvent: (d: Date) => void;
  onEditEvent: (e: CalendarEvent) => void;
}) {
  const year = selected.getFullYear();
  const month = selected.getMonth();
  const firstDay = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const offset = (firstDay.getDay() + 6) % 7;
  const todayKey = toKey(new Date());

  const cells: (Date | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Card>
      <CardContent className="p-2 sm:p-4">
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1 text-center text-xs font-medium text-muted-foreground">{w}</div>
          ))}
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} />;
            const key = toKey(d);
            const isToday = key === todayKey;
            const arrivals = arrivalsOn(data.reservations, d);
            const departures = departuresOn(data.reservations, d);
            const inHouse = inHouseOn(data.reservations, d);
            const events = eventsOn(data.events, key);
            const totalRooms = data.rooms.length;
            const rate = totalRooms ? Math.round((inHouse.length / Math.max(1, totalRooms)) * 100) : 0;

            return (
              <div
                key={key}
                onClick={() => onSelectDay(d)}
                className={cn(
                  'min-h-[76px] cursor-pointer rounded-lg border p-1 transition-colors hover:bg-muted/60',
                  isToday ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/30',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn('text-xs font-medium', isToday && 'text-primary')}>{d.getDate()}</span>
                  {arrivals.length + departures.length > 0 && (
                    <div className="flex items-center gap-0.5">
                      {arrivals.length > 0 && <Badge className="bg-emerald-500/90 px-1 text-[10px]">{arrivals.length}↓</Badge>}
                      {departures.length > 0 && <Badge className="bg-amber-500/90 px-1 text-[10px]">{departures.length}↑</Badge>}
                    </div>
                  )}
                </div>
                {inHouse.length > 0 && (
                  <p className="text-[10px] text-muted-foreground">
                    <BedDouble className="mr-0.5 inline h-3 w-3" />{inHouse.length} · {rate}%
                  </p>
                )}
                <div className="mt-0.5 space-y-0.5">
                  {events.slice(0, 2).map((e) => (
                    <div
                      key={e.id}
                      onClick={(ev) => { ev.stopPropagation(); onEditEvent(e); }}
                      className="truncate rounded px-1 text-[10px] text-white"
                      style={{ backgroundColor: e.color || TIPO_EVENTO[e.tipo].color }}
                    >
                      {e.horaInicio ? `${e.horaInicio} ` : ''}{e.titulo}
                    </div>
                  ))}
                  {events.length > 2 && (
                    <p className="text-[10px] text-muted-foreground">+{events.length - 2} más</p>
                  )}
                </div>
                {events.length === 0 && inHouse.length === 0 && arrivals.length === 0 && departures.length === 0 && (
                  <div className="mt-1 flex justify-end">
                    <button
                      onClick={(ev) => { ev.stopPropagation(); onNewEvent(d); }}
                      className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:opacity-100"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function WeekView({ data, selected, onSelectDay, onEditEvent }: {
  data: CalendarData;
  selected: Date;
  onSelectDay: (d: Date) => void;
  onEditEvent: (e: CalendarEvent) => void;
}) {
  const monday = addDays(startOfDay(selected), -((startOfDay(selected).getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const todayKey = toKey(new Date());

  return (
    <Card>
      <CardContent className="p-2 sm:p-4">
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1 text-center text-xs font-medium text-muted-foreground">{w}</div>
          ))}
          {days.map((d) => {
            const key = toKey(d);
            const isToday = key === todayKey;
            const arrivals = arrivalsOn(data.reservations, d);
            const departures = departuresOn(data.reservations, d);
            const inHouse = inHouseOn(data.reservations, d);
            const events = eventsOn(data.events, key);
            const totalRooms = data.rooms.length;
            const rate = totalRooms ? Math.round((inHouse.length / Math.max(1, totalRooms)) * 100) : 0;

            return (
              <div
                key={key}
                onClick={() => onSelectDay(d)}
                className={cn(
                  'min-h-[120px] cursor-pointer rounded-lg border p-1 transition-colors hover:bg-muted/60',
                  isToday ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/30',
                )}
              >
                <div className="text-center">
                  <span className={cn('text-xs font-bold', isToday ? 'text-primary' : 'text-muted-foreground')}>{d.getDate()}</span>
                </div>
                <p className="mt-1 text-center text-[10px] font-medium">
                  <BedDouble className="mr-0.5 inline h-3 w-3 text-muted-foreground" />{inHouse.length}
                  <span className="text-muted-foreground"> · {rate}%</span>
                </p>
                <div className="mt-1 space-y-1 text-center">
                  {arrivals.length > 0 && (
                    <Badge className="w-full justify-center bg-emerald-500/90 text-[10px]">{arrivals.length} llegada{arrivals.length > 1 ? 's' : ''}</Badge>
                  )}
                  {departures.length > 0 && (
                    <Badge className="w-full justify-center bg-amber-500/90 text-[10px]">{departures.length} salida{departures.length > 1 ? 's' : ''}</Badge>
                  )}
                  {events.map((e) => (
                    <div
                      key={e.id}
                      onClick={(ev) => { ev.stopPropagation(); onEditEvent(e); }}
                      className="truncate rounded px-1 text-[10px] text-white"
                      style={{ backgroundColor: e.color || TIPO_EVENTO[e.tipo].color }}
                    >
                      {e.titulo}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function DayView({ data, selected, onNewEvent, onEditEvent }: {
  data: CalendarData;
  selected: Date;
  onNewEvent: (d: Date) => void;
  onEditEvent: (e: CalendarEvent) => void;
}) {
  const arrivals = arrivalsOn(data.reservations, selected);
  const departures = departuresOn(data.reservations, selected);
  const inHouse = inHouseOn(data.reservations, selected);
  const events = eventsOn(data.events, toKey(selected));
  const totalRooms = data.rooms.length;
  const rate = totalRooms ? Math.round((inHouse.length / Math.max(1, totalRooms)) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Resumen del día */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <DayStat icon={<CalendarCheck className="h-5 w-5" />} label="Llegadas" value={arrivals.length} accent="bg-emerald-500/10 text-emerald-500" />
        <DayStat icon={<CalendarX className="h-5 w-5" />} label="Salidas" value={departures.length} accent="bg-amber-500/10 text-amber-500" />
        <DayStat icon={<Users className="h-5 w-5" />} label="En casa" value={inHouse.length} accent="bg-sky-500/10 text-sky-500" />
        <DayStat icon={<BedDouble className="h-5 w-5" />} label="Ocupación" value={`${rate}%`} accent="bg-primary/10 text-primary" />
      </div>

      {/* Estado habitaciones */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <DoorOpen className="h-4 w-4" /> Estado de habitaciones
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(ROOM_STATE).map(([k, color]) => (
              <span key={k} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className={`h-2 w-2 rounded-full ${color}`} />{getStatusLabel(k)}
              </span>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
            {data.rooms.map((r) => {
              const occupied = inHouse.some((ih) => ih.room?.id === r.id);
              const arriving = arrivals.some((a) => a.room?.id === r.id);
              const leaving = departures.some((d) => d.room?.id === r.id);
              return (
                <div
                  key={r.id}
                  className={cn(
                    'relative flex flex-col items-center rounded-lg border p-2',
                    occupied ? 'border-red-500/40 bg-red-500/10' : 'border-transparent bg-muted/40',
                  )}
                >
                  <span className={cn('h-2 w-2 rounded-full', ROOM_STATE[r.estado] ?? 'bg-slate-400')} />
                  <span className="mt-1 text-sm font-semibold">{r.numero}</span>
                  <span className="text-[10px] text-muted-foreground">{r.roomType?.nombre ?? ''}</span>
                  <div className="mt-1 flex items-center gap-0.5">
                    {arriving && <Badge className="bg-emerald-500 px-1 text-[9px]">↓</Badge>}
                    {leaving && <Badge className="bg-amber-500 px-1 text-[9px]">↑</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Eventos del día */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <CalendarRange className="h-4 w-4" /> Eventos
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => onNewEvent(selected)}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Agregar
          </Button>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Sin eventos este día.</p>
          ) : (
            <ul className="divide-y">
              {events.map((e) => (
                <li key={e.id} onClick={() => onEditEvent(e)} className="flex cursor-pointer items-center gap-3 py-2 hover:bg-muted/50">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: e.color || TIPO_EVENTO[e.tipo].color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.horaInicio ? `${e.horaInicio}${e.horaFin ? ` - ${e.horaFin}` : ''} · ` : ''}
                      {TIPO_EVENTO[e.tipo].label}
                      {e.descripcion ? ` · ${e.descripcion}` : ''}
                    </p>
                  </div>
                  <Pencil className="h-4 w-4 shrink-0 text-muted-foreground" />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Listados del día */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <DayStayList
          title="Llegadas"
          icon={<CalendarCheck className="h-4 w-4 text-emerald-500" />}
          reservations={arrivals}
          emptyText="Sin llegadas este día."
        />
        <DayStayList
          title="Salidas"
          icon={<CalendarX className="h-4 w-4 text-amber-500" />}
          reservations={departures}
          emptyText="Sin salidas este día."
        />
        <DayStayList
          title="En casa"
          icon={<Users className="h-4 w-4 text-sky-500" />}
          reservations={inHouse}
          emptyText="Sin huéspedes en casa."
        />
      </div>
    </div>
  );
}

function DayStat({ icon, label, value, accent }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className={`rounded-lg p-2 ${accent}`}>{icon}</span>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DayStayList({ title, icon, reservations, emptyText }: {
  title: string;
  icon: React.ReactNode;
  reservations: CalendarReservation[];
  emptyText: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">{icon} {title}</CardTitle>
      </CardHeader>
        <CardContent>
          {reservations.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{emptyText}</p>
          ) : (
            <ul className="divide-y">
              {reservations.map((r) => (
                <li key={r.id} className="py-2">
                  <p className="text-sm font-medium">{guestName(r)}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.room ? `${r.room.numero} · ` : ''}
                    {formatDateShort(r.fechaEntrada)} → {formatDateShort(r.fechaSalida)}
                    {r.cantidadHuespedes ? ` · ${r.cantidadHuespedes} huésped${r.cantidadHuespedes > 1 ? 'es' : ''}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    );
  }

// ---------- Vista de habitaciones (línea de tiempo) ----------

const TIMELINE_STYLE: Record<string, { cell: string; label: string; dot: string }> = {
  disponible: { cell: 'bg-green-50 hover:bg-green-100', label: 'Disp', dot: 'bg-emerald-500' },
  reservada: { cell: 'bg-yellow-50 hover:bg-yellow-100', label: 'Res', dot: 'bg-amber-500' },
  ocupada: { cell: 'bg-red-50', label: 'Ocup', dot: 'bg-red-500' },
  limpieza: { cell: 'bg-blue-50', label: 'Limp', dot: 'bg-sky-500' },
  mantenimiento: { cell: 'bg-gray-100', label: 'Mant', dot: 'bg-purple-500' },
  salida: { cell: 'bg-green-50 hover:bg-green-100', label: 'Sale', dot: 'bg-emerald-500' },
};

function weekdayShort(d: Date) {
  return WEEKDAYS[(d.getDay() + 6) % 7];
}

function RoomTimelineView({ data, selected, onSelectDay }: {
  data: CalendarData;
  selected: Date;
  onSelectDay: (d: Date) => void;
}) {
  const year = selected.getFullYear();
  const month = selected.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: totalDays }, (_, i) => new Date(year, month, i + 1));
  const todayKey = toKey(new Date());
  const [detail, setDetail] = useState<CalendarReservation | null>(null);
  const [tooltip, setTooltip] = useState<{ reservation: CalendarReservation; roomNumero: string; x: number; y: number } | null>(null);

  const resByRoom = useMemo(() => {
    const m = new Map<string, CalendarReservation[]>();
    for (const r of data.reservations) {
      if (!r.room) continue;
      const list = m.get(r.room.id) ?? [];
      list.push(r);
      m.set(r.room.id, list);
    }
    return m;
  }, [data.reservations]);

  const cellFor = (room: CalendarRoom, day: Date): { status: keyof typeof TIMELINE_STYLE; reservation?: CalendarReservation; isArrival?: boolean } => {
    if (room.estado === 'mantenimiento') return { status: 'mantenimiento' };
    const list = resByRoom.get(room.id) ?? [];
    const from = day.getTime();
    const to = from + DAILY_MS;
    const active = list.find((r) => {
      const s = new Date(r.fechaEntrada).getTime();
      const e = new Date(r.fechaSalida).getTime();
      return s < to && e > from;
    });
    if (active) {
      const isArrival = new Date(active.fechaEntrada).getTime() === from;
      return { status: active.estado === 'checkin' ? 'ocupada' : 'reservada', reservation: active, isArrival };
    }
    if (room.estado === 'limpieza') return { status: 'limpieza' };
    const salida = list.find((r) => new Date(r.fechaSalida).getTime() === from);
    if (salida) return { status: 'salida', reservation: salida };
    return { status: 'disponible' };
  };

  const daySel = startOfDay(selected);
  const arrivals = arrivalsOn(data.reservations, daySel);
  const departures = departuresOn(data.reservations, daySel);
  const inHouse = inHouseOn(data.reservations, daySel);
  const rate = data.rooms.length ? Math.round((inHouse.length / data.rooms.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {Object.entries(TIMELINE_STYLE).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1">
            <span className={`h-2.5 w-2.5 rounded-full ${v.dot}`} />{getStatusLabel(k)}
          </span>
        ))}
      </div>

      {/* Línea de tiempo — escritorio/tablet */}
      <div className="hidden md:block overflow-x-auto rounded-lg border">
        <div style={{ minWidth: '900px' }}>
          <div className="grid" style={{ gridTemplateColumns: '150px repeat(' + days.length + ', 1fr)' }}>
            <div className="sticky left-0 z-20 border-b border-r bg-background p-2 text-xs font-semibold">
              Habitación
            </div>
            {days.map((d) => {
              const key = toKey(d);
              const dayEvents = eventsOn(data.events, key);
              return (
                <div
                  key={key}
                  onClick={() => onSelectDay(d)}
                  className={cn(
                    'cursor-pointer border-b border-r p-1.5 text-center transition-colors hover:bg-muted/60',
                    key === todayKey ? 'bg-primary/10' : 'bg-background',
                  )}
                >
                  <div className="text-[10px] text-muted-foreground">{weekdayShort(d)}</div>
                  <div className="text-sm font-semibold">{d.getDate()}</div>
                  {dayEvents.length > 0 && (
                    <div className="mt-0.5 flex justify-center gap-0.5">
                      {dayEvents.slice(0, 3).map((e) => (
                        <span
                          key={e.id}
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: e.color || TIPO_EVENTO[e.tipo].color }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {data.rooms.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Sin habitaciones registradas</div>
          ) : (
            data.rooms.map((room) => (
              <div key={room.id} className="grid" style={{ gridTemplateColumns: '150px repeat(' + days.length + ', 1fr)' }}>
                <div className="sticky left-0 z-10 flex items-center gap-2 border-b border-r bg-background p-2 text-xs font-medium">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: room.roomType?.colorIdentificador || '#3B82F6' }}
                  />
                  <span className="shrink-0 font-semibold">{room.numero}</span>
                  <span className="truncate text-[10px] text-muted-foreground">{room.roomType?.nombre ?? ''}</span>
                </div>
                {days.map((d) => {
                  const key = toKey(d);
                  const c = cellFor(room, d);
                  return (
                    <div
                      key={key}
                      onClick={() => (c.reservation ? setDetail(c.reservation) : onSelectDay(d))}
                      onMouseEnter={(e) => {
                        if (c.reservation) {
                          setTooltip({
                            reservation: c.reservation,
                            roomNumero: room.numero,
                            x: e.clientX + 12,
                            y: e.clientY + 12,
                          });
                        }
                      }}
                      onMouseMove={(e) => {
                        if (c.reservation) {
                          setTooltip((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  x: Math.min(e.clientX + 12, window.innerWidth - 280),
                                  y: Math.min(e.clientY + 12, window.innerHeight - 240),
                                }
                              : prev,
                          );
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      className={cn(
                        'flex min-h-[48px] cursor-pointer flex-col items-center justify-center border-b border-r px-1 py-0.5 text-center transition-colors',
                        TIMELINE_STYLE[c.status].cell,
                        key === todayKey && 'ring-1 ring-inset ring-primary/40',
                      )}
                      title={c.reservation ? `${room.numero} · ${c.reservation.codigo} · ${guestName(c.reservation)}` : `${room.numero} · ${getStatusLabel(c.status)}`}
                    >
                      <span className={cn('text-[9px] font-semibold uppercase', c.isArrival && 'text-emerald-700')}>
                        {c.isArrival ? '↓ Entra' : TIMELINE_STYLE[c.status].label}
                      </span>
                      {c.reservation && (
                        <span className="max-w-full truncate text-[8px] leading-tight text-muted-foreground">
                          {c.status === 'salida' && <span className="mr-0.5 text-green-600">↳</span>}
                          {guestName(c.reservation)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Vista móvil — día a día, desglosado */}
      <div className="space-y-3 md:hidden">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {days.map((d) => {
            const key = toKey(d);
            const isSel = key === toKey(selected);
            const isT = key === todayKey;
            return (
              <button
                key={key}
                onClick={() => onSelectDay(d)}
                className={cn(
                  'flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border text-xs transition-colors',
                  isSel
                    ? 'border-primary bg-primary text-primary-foreground'
                    : isT
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-input bg-background text-muted-foreground',
                )}
              >
                <span>{weekdayShort(d)}</span>
                <span className="text-sm font-bold">{d.getDate()}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-4 gap-2">
          <DayStat icon={<CalendarCheck className="h-4 w-4" />} label="Llegan" value={arrivals.length} accent="bg-emerald-500/10 text-emerald-500" />
          <DayStat icon={<CalendarX className="h-4 w-4" />} label="Saldr." value={departures.length} accent="bg-amber-500/10 text-amber-500" />
          <DayStat icon={<Users className="h-4 w-4" />} label="En casa" value={inHouse.length} accent="bg-sky-500/10 text-sky-500" />
          <DayStat icon={<BedDouble className="h-4 w-4" />} label="Ocup." value={`${rate}%`} accent="bg-primary/10 text-primary" />
        </div>

        <p className="text-sm font-semibold capitalize">{formatDateShort(selected)}</p>

        <div className="space-y-2">
          {data.rooms.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Sin habitaciones registradas</p>
          ) : (
            data.rooms.map((room) => {
              const c = cellFor(room, daySel);
              const res = c.reservation;
              const isArrival = arrivals.some((a) => a.room?.id === room.id);
              const isDeparture = departures.some((d) => d.room?.id === room.id);
              return (
                <div key={room.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${TIMELINE_STYLE[c.status].dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold">Hab. {room.numero}</span>
                      <Badge variant="outline" className="px-1.5 text-[10px]">{getStatusLabel(c.status)}</Badge>
                      {isArrival && <Badge className="bg-emerald-500 px-1.5 text-[9px]">Llega hoy</Badge>}
                      {isDeparture && <Badge className="bg-amber-500 px-1.5 text-[9px]">Sale hoy</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{room.roomType?.nombre ?? '—'}</p>
                    {res ? (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-sm font-medium">{guestName(res)}</p>
                        <p className="text-xs text-muted-foreground">
                          {res.guest?.documento ? `Doc. ${res.guest.documento} · ` : ''}
                          {res.cantidadHuespedes ? `${res.cantidadHuespedes} huésped${res.cantidadHuespedes > 1 ? 'es' : ''} · ` : ''}
                          {res.codigo}
                        </p>
                        <p className="text-xs">{formatDateShort(res.fechaEntrada)} → {formatDateShort(res.fechaSalida)}</p>
                        {res.resumen && (
                          <div className="mt-1 grid grid-cols-3 gap-2 rounded-md border bg-muted/30 p-1.5 text-[11px]">
                            <div>
                              <p className="text-[9px] text-muted-foreground">Total</p>
                              <p className="font-semibold">{formatCurrency(res.resumen.totalEstancia)}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-green-600">Pagado</p>
                              <p className="font-semibold text-green-700">{formatCurrency(res.resumen.totalPagado)}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-red-600">Saldo</p>
                              <p className="font-semibold text-red-700">{formatCurrency(res.resumen.saldoPendiente)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-green-600">Disponible</p>
                    )}
                  </div>
                  {res && (
                    <Button variant="ghost" size="sm" onClick={() => setDetail(res)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Detalle de reserva */}
      <Dialog open={!!detail} onOpenChange={(v) => { if (!v) setDetail(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{detail?.codigo ?? 'Reserva'}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{getStatusLabel(detail.estado)}</Badge>
                {detail.room && <Badge variant="outline">Hab. {detail.room.numero}</Badge>}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Huésped</p>
                <p className="font-medium">{guestName(detail)}</p>
                {detail.guest?.documento && <p className="text-xs text-muted-foreground">Doc. {detail.guest.documento}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Entrada</p>
                  <p className="font-medium">{formatDateShort(detail.fechaEntrada)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Salida</p>
                  <p className="font-medium">{formatDateShort(detail.fechaSalida)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Huéspedes</p>
                <p className="font-medium">{detail.cantidadHuespedes ?? '—'}</p>
              </div>
              {detail.resumen && (
                <div className="space-y-1 rounded-lg border p-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total estancia ({detail.resumen.noches} noche{detail.resumen.noches !== 1 ? 's' : ''})</span>
                    <span className="font-medium">{formatCurrency(detail.resumen.totalEstancia)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Pagado</span>
                    <span className="font-medium">{formatCurrency(detail.resumen.totalPagado)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 text-red-600">
                    <span>Saldo pendiente</span>
                    <span className="font-bold">{formatCurrency(detail.resumen.saldoPendiente)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tooltip hover */}
      {tooltip && tooltip.reservation && (
        <div
          className="pointer-events-none fixed z-50 w-64 rounded-lg border bg-background p-3 text-xs shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="font-semibold text-primary">{tooltip.reservation.codigo}</span>
            <span className="text-[10px] text-muted-foreground">Hab. {tooltip.roomNumero}</span>
          </div>
          <div className="space-y-1 text-muted-foreground">
            <p className="font-medium text-foreground">{guestName(tooltip.reservation)}</p>
            <p>Entrada: <span className="font-medium text-foreground">{formatDateShort(tooltip.reservation.fechaEntrada)}</span></p>
            <p>Salida: <span className="font-medium text-foreground">{formatDateShort(tooltip.reservation.fechaSalida)}</span></p>
            <p className="capitalize">Estado: {getStatusLabel(tooltip.reservation.estado)}</p>
          </div>
          {tooltip.reservation.resumen && (
            <div className="mt-2 space-y-1 border-t pt-2">
              <div className="flex justify-between">
                <span>Total estancia</span>
                <span className="font-medium">{formatCurrency(tooltip.reservation.resumen.totalEstancia)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Pagado</span>
                <span className="font-medium">{formatCurrency(tooltip.reservation.resumen.totalPagado)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Saldo</span>
                <span className="font-bold">{formatCurrency(tooltip.reservation.resumen.saldoPendiente)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
