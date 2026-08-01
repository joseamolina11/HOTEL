import apiClient from './client';

export interface OccupancyPoint {
  date: string;
  occupiedRooms: number;
  totalRooms: number;
  rate: number;
  forecast: boolean;
}

export interface RevenueSummary {
  today: number;
  week: number;
  month: number;
  todayVsYesterday: { value: number; direction: 'up' | 'down' | 'flat' };
  weekVsPrevWeek: { value: number; direction: 'up' | 'down' | 'flat' };
  monthVsPrevMonth: { value: number; direction: 'up' | 'down' | 'flat' };
}

export interface RevenuePoint {
  date: string;
  total: number;
}

export interface AdrRevpar {
  adrToday: number;
  revparToday: number;
  adr7d: number;
  revpar7d: number;
  adrTrend: { value: number; direction: 'up' | 'down' | 'flat' };
  revparTrend: { value: number; direction: 'up' | 'down' | 'flat' };
}

export interface GuestPreview {
  id: string;
  nombres: string;
  apellidos: string;
}

export interface RoomPreview {
  id: string;
  numero: string;
  nombre: string;
}

export interface ReservationPreview {
  id: string;
  codigo: string;
  fechaEntrada: string;
  fechaSalida: string;
  guest: GuestPreview | null;
  room: RoomPreview | null;
}

export interface GerencialSummary {
  asOf: string;
  totalRooms: number;
  roomsByStatus: Record<string, number>;
  occupancy: {
    occupiedRooms: number;
    availableRooms: number;
    maintenanceRooms: number;
    rate: number;
    trend: { value: number; direction: 'up' | 'down' | 'flat' };
  };
  occupancyTrend: OccupancyPoint[];
  revenue: RevenueSummary;
  revenueByDay: RevenuePoint[];
  reservations: {
    upcoming: number;
    arrivalsToday: number;
    departuresToday: number;
    inHouse: number;
    nextArrivals: ReservationPreview[];
    nextDepartures: ReservationPreview[];
  };
  adrRevpar: AdrRevpar;
  alerts: { type: 'info' | 'warning' | 'critical'; message: string }[];
  insights: { tipo: 'positivo' | 'negativo' | 'neutral'; mensaje: string }[];
}

export interface CalendarRoom {
  id: string;
  numero: string;
  nombre: string;
  piso: string;
  estado: string;
  roomType: { id: string; nombre: string; colorIdentificador: string } | null;
}

export interface ReservationSummary {
  noches: number;
  precioNoche: number;
  totalEstancia: number;
  totalPagado: number;
  saldoPendiente: number;
}

export interface CalendarReservation {
  id: string;
  codigo: string;
  estado: string;
  fechaEntrada: string;
  fechaSalida: string;
  cantidadHuespedes: number;
  guest: { id: string; nombres: string; apellidos: string; documento: string } | null;
  room: { id: string; numero: string; nombre: string } | null;
  resumen?: ReservationSummary | null;
}

export interface CalendarEvent {
  id: string;
  titulo: string;
  descripcion?: string | null;
  fecha: string;
  horaInicio?: string | null;
  horaFin?: string | null;
  tipo: 'evento' | 'mantenimiento' | 'feriado' | 'otro';
  color?: string | null;
}

export interface CalendarData {
  rooms: CalendarRoom[];
  reservations: CalendarReservation[];
  events: CalendarEvent[];
}

export interface EventPayload {
  titulo: string;
  descripcion?: string;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  tipo?: 'evento' | 'mantenimiento' | 'feriado' | 'otro';
  color?: string;
}

export const dashboardGerencialApi = {
  getSummary: async (): Promise<GerencialSummary> => {
    const { data } = await apiClient.get('/dashboard-gerencial/summary');
    return data?.data ?? data;
  },

  getCalendar: async (inicio: string, fin: string): Promise<CalendarData> => {
    const { data } = await apiClient.get('/dashboard-gerencial/calendar', {
      params: { inicio, fin },
    });
    return data?.data ?? data;
  },

  getEvents: async (params?: { desde?: string; hasta?: string }): Promise<CalendarEvent[]> => {
    const { data } = await apiClient.get('/dashboard-gerencial/events', { params });
    return data?.data ?? data;
  },

  createEvent: async (payload: EventPayload): Promise<CalendarEvent> => {
    const { data } = await apiClient.post('/dashboard-gerencial/events', payload);
    return data?.data ?? data;
  },

  updateEvent: async (id: string, payload: Partial<EventPayload>): Promise<CalendarEvent> => {
    const { data } = await apiClient.put(`/dashboard-gerencial/events/${id}`, payload);
    return data?.data ?? data;
  },

  deleteEvent: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.delete(`/dashboard-gerencial/events/${id}`);
    return data?.data ?? data;
  },
};
