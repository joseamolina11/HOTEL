import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Room } from 'src/modules/rooms/entities/room.entity';
import { Reservation } from 'src/modules/reservations/entities/reservation.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { CalendarEvent } from './entities/calendar-event.entity';
import { CreateCalendarEventDto, UpdateCalendarEventDto } from './dto/dashboard-gerencial.dto';
import { getTodayRange } from 'src/common/utils/date-utils';
import { NotificationsService } from 'src/modules/notifications/notifications.service';

const DAILY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class DashboardGerencialService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(CalendarEvent)
    private readonly eventRepository: Repository<CalendarEvent>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ============ SUMMARY ============

  async getSummary() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + DAILY_MS);
    const yesterday = new Date(today.getTime() - DAILY_MS);

    const totalRooms = await this.roomRepository.count();
    const roomsByStatus = await this.roomStatusCounts();

    // ---- Reservations for calculations ----
    const daysBack = 14;
    const daysAhead = 7;
    const rangeStart = new Date(today.getTime() - daysBack * DAILY_MS);
    const rangeEnd = new Date(today.getTime() + (daysAhead + 1) * DAILY_MS);

    const reservations = await this.reservationRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.room', 'room')
      .leftJoinAndSelect('room.roomType', 'roomType')
      .leftJoinAndSelect('r.guest', 'guest')
      .leftJoinAndSelect('r.payments', 'payments')
      .leftJoinAndSelect('r.surcharges', 'surcharges', 'surcharges.deleted_at IS NULL')
      .where('r.estado <> :cancelada', { cancelada: 'cancelada' })
      .andWhere('r.fechaSalida > :from', { from: rangeStart })
      .andWhere('r.fechaEntrada < :to', { to: rangeEnd })
      .orderBy('r.fechaEntrada', 'ASC')
      .getMany();

    const inHouse = reservations.filter((r) => r.estado === 'checkin');
    const occupiedRooms = new Set(inHouse.map((r) => r.roomId)).size;

    // ---- Occupancy ----
    const occupancyTrend = this.buildOccupancyTrend(reservations, totalRooms, today, daysBack, daysAhead);
    const currentRate = totalRooms ? Math.round((occupiedRooms / Math.max(1, totalRooms - roomsByStatus.mantenimiento)) * 100) : 0;
    const prevRate = totalRooms
      ? Math.round((this.countOccupiedOn(reservations, yesterday, today, ['checkin', 'checkout']) / Math.max(1, totalRooms - roomsByStatus.mantenimiento)) * 100)
      : 0;
    const occupancyTrendVal = prevRate > 0 ? Math.round(((currentRate - prevRate) / prevRate) * 100) : 0;

    // ---- Revenue (collections) ----
    const revenue = await this.computeRevenue(today, tomorrow);
    const revenueByDay = await this.revenueByDay(today, daysBack);

    // ---- ADR / RevPAR ----
    const adrRevpar = await this.computeAdrRevpar(reservations, inHouse, occupiedRooms, totalRooms, today);

    // ---- Reservations KPIs ----
    const arrivalsToday = reservations.filter(
      (r) => r.estado === 'confirmada' && r.fechaEntrada.getTime() >= today.getTime() && r.fechaEntrada.getTime() < tomorrow.getTime(),
    );
    const departuresToday = reservations.filter(
      (r) => r.estado === 'checkin' && r.fechaSalida.getTime() >= today.getTime() && r.fechaSalida.getTime() < tomorrow.getTime(),
    );
    const upcoming = reservations.filter(
      (r) => r.estado === 'confirmada' && r.fechaEntrada.getTime() >= tomorrow.getTime(),
    ).length;

    const nextArrivals = reservations
      .filter((r) => r.estado === 'confirmada' && r.fechaEntrada.getTime() >= tomorrow.getTime())
      .slice(0, 5)
      .map((r) => this.previewReservation(r));

    const nextDepartures = reservations
      .filter((r) => r.estado === 'checkin' && r.fechaSalida.getTime() >= tomorrow.getTime())
      .sort((a, b) => a.fechaSalida.getTime() - b.fechaSalida.getTime())
      .slice(0, 5)
      .map((r) => this.previewReservation(r));

    const unpaidInHouse = inHouse.filter((r) => this.saldoPendiente(r) > 0);

    // ---- Alerts ----
    const alerts = this.buildAlerts({
      totalRooms,
      roomsByStatus,
      occupiedRooms,
      arrivalsToday: arrivalsToday.length,
      departuresToday: departuresToday.length,
      unpaidInHouse,
      upcoming,
      occupancyTrend,
      currentRate,
    });

    // ---- Insights ----
    const insights = this.buildInsights({
      revenue,
      currentRate,
      adrRevpar,
      arrivalsToday: arrivalsToday.length,
      departuresToday: departuresToday.length,
      occupancyTrend,
      unpaidInHouse: unpaidInHouse.length,
    });

    return {
      asOf: now,
      totalRooms,
      roomsByStatus,
      occupancy: {
        occupiedRooms,
        availableRooms: Math.max(0, totalRooms - occupiedRooms - roomsByStatus.mantenimiento),
        maintenanceRooms: roomsByStatus.mantenimiento,
        rate: currentRate,
        trend: { value: occupancyTrendVal, direction: occupancyTrendVal > 0 ? 'up' : occupancyTrendVal < 0 ? 'down' : 'flat' },
      },
      occupancyTrend,
      revenue,
      revenueByDay,
      reservations: {
        upcoming,
        arrivalsToday: arrivalsToday.length,
        departuresToday: departuresToday.length,
        inHouse: occupiedRooms,
        nextArrivals,
        nextDepartures,
      },
      adrRevpar,
      alerts,
      insights,
    };
  }

  private async roomStatusCounts() {
    const rows = await this.roomRepository
      .createQueryBuilder('room')
      .select('room.estado', 'estado')
      .addSelect('COUNT(room.id)', 'count')
      .groupBy('room.estado')
      .getRawMany();
    const map: Record<string, number> = { disponibles: 0, ocupadas: 0, reservadas: 0, limpieza: 0, mantenimiento: 0 };
    rows.forEach((r: any) => {
      const key = r.estado === 'disponible' ? 'disponibles' : r.estado === 'ocupada' ? 'ocupadas' : r.estado === 'reservada' ? 'reservadas' : r.estado === 'limpieza' ? 'limpieza' : r.estado === 'mantenimiento' ? 'mantenimiento' : null;
      if (key) map[key] = parseInt(r.count, 10);
    });
    return map;
  }

  private buildOccupancyTrend(reservations: Reservation[], totalRooms: number, today: Date, daysBack: number, daysAhead: number) {
    const trend = [];
    for (let i = -daysBack; i <= daysAhead; i++) {
      const dayStart = new Date(today.getTime() + i * DAILY_MS);
      const dayEnd = new Date(dayStart.getTime() + DAILY_MS);
      const isFuture = dayStart.getTime() >= today.getTime();
      const estados = isFuture ? ['checkin', 'confirmada'] : ['checkin', 'checkout'];
      const occupied = this.countOccupiedOn(reservations, dayStart, dayEnd, estados);
      trend.push({
        date: dayStart.toISOString().slice(0, 10),
        occupiedRooms: occupied,
        totalRooms,
        rate: totalRooms ? Math.round((occupied / Math.max(1, totalRooms)) * 100) : 0,
        forecast: isFuture,
      });
    }
    return trend;
  }

  private countOccupiedOn(reservations: Reservation[], from: Date, to: Date, estados: string[]) {
    const rooms = new Set<string>();
    reservations.forEach((r) => {
      if (!estados.includes(r.estado)) return;
      const startsBefore = r.fechaEntrada.getTime() < to.getTime();
      const endsAfter = r.fechaSalida.getTime() > from.getTime();
      if (startsBefore && endsAfter) rooms.add(r.roomId);
    });
    return rooms.size;
  }

  private async computeRevenue(today: Date, tomorrow: Date) {
    const weekStart = new Date(today.getTime() - 6 * DAILY_MS);
    const prevWeekStart = new Date(today.getTime() - 13 * DAILY_MS);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const sumRange = async (from: Date, to: Date) => {
      const row = await this.paymentRepository
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.monto), 0)', 'total')
        .where('p.fecha >= :from', { from })
        .andWhere('p.fecha < :to', { to })
        .getRawOne();
      return Number(row?.total || 0);
    };

    const todayVal = await sumRange(today, tomorrow);
    const yesterdayVal = await sumRange(new Date(today.getTime() - DAILY_MS), today);
    const weekVal = await sumRange(weekStart, tomorrow);
    const prevWeekVal = await sumRange(prevWeekStart, weekStart);
    const monthVal = await sumRange(monthStart, tomorrow);
    const prevMonthVal = await sumRange(prevMonthStart, monthStart);

    return {
      today: todayVal,
      week: weekVal,
      month: monthVal,
      todayVsYesterday: this.pctChange(yesterdayVal, todayVal),
      weekVsPrevWeek: this.pctChange(prevWeekVal, weekVal),
      monthVsPrevMonth: this.pctChange(prevMonthVal, monthVal),
    };
  }

  private async revenueByDay(today: Date, daysBack: number) {
    const from = new Date(today.getTime() - daysBack * DAILY_MS);
    const to = new Date(today.getTime() + DAILY_MS);
    const payments = await this.paymentRepository.find({
      where: { fecha: Between(from, to) },
    });
    const map = new Map<string, number>();
    for (let i = daysBack; i >= 0; i--) {
      const d = new Date(today.getTime() - i * DAILY_MS);
      map.set(d.toISOString().slice(0, 10), 0);
    }
    payments.forEach((p) => {
      const key = p.fecha.toISOString().slice(0, 10);
      if (map.has(key)) map.set(key, (map.get(key) || 0) + Number(p.monto));
    });
    return Array.from(map.entries()).map(([date, total]) => ({ date, total: Math.round(total * 100) / 100 }));
  }

  private async computeAdrRevpar(reservations: Reservation[], inHouse: Reservation[], occupiedRooms: number, totalRooms: number, today: Date) {
    const now = new Date();
    const nightRate = (r: Reservation) => Number(r.precioBase ?? r.room?.roomType?.precioBase ?? 0);

    // Today: sum nightly rate of current in-house stays
    const roomRevenueToday = inHouse.reduce((s, r) => s + nightRate(r), 0);
    const adrToday = occupiedRooms ? Math.round(roomRevenueToday / occupiedRooms) : 0;
    const revparToday = totalRooms ? Math.round(roomRevenueToday / Math.max(1, totalRooms)) : 0;

    // 7-day window vs previous 7-day window based on rooms actually occupied
    const day7Start = new Date(today.getTime() - 6 * DAILY_MS);
    const prev7Start = new Date(today.getTime() - 13 * DAILY_MS);

    const windowStat = (from: Date, to: Date) => {
      const occupiedDays = new Map<string, number>();
      let roomRevenue = 0;
      reservations.forEach((r) => {
        const start = Math.max(r.fechaEntrada.getTime(), from.getTime());
        const end = Math.min(r.fechaSalida.getTime(), to.getTime());
        if (end <= start) return;
        const nights = Math.round((end - start) / DAILY_MS);
        if (nights <= 0) return;
        roomRevenue += nights * nightRate(r);
        for (let d = from.getTime(); d < to.getTime(); d += DAILY_MS) {
          if (r.fechaEntrada.getTime() < d + DAILY_MS && r.fechaSalida.getTime() > d) {
            const key = new Date(d).toISOString().slice(0, 10);
            occupiedDays.set(key, (occupiedDays.get(key) || 0) + 1);
          }
        }
      });
      const totalNights = Array.from(occupiedDays.values()).reduce((s, n) => s + Math.min(n, totalRooms), 0);
      const adr = totalNights ? roomRevenue / totalNights : 0;
      const revpar = totalRooms ? roomRevenue / (totalRooms * Math.max(1, Math.round((to.getTime() - from.getTime()) / DAILY_MS))) : 0;
      return { adr, revpar };
    };

    const current = windowStat(day7Start, new Date(Math.min(today.getTime() + DAILY_MS, now.getTime())));
    const previous = windowStat(prev7Start, day7Start);

    return {
      adrToday,
      revparToday,
      adr7d: Math.round(current.adr),
      revpar7d: Math.round(current.revpar),
      adrTrend: this.pctChange(previous.adr, current.adr),
      revparTrend: this.pctChange(previous.revpar, current.revpar),
    };
  }

  private previewReservation(r: Reservation) {
    return {
      id: r.id,
      codigo: r.codigo,
      fechaEntrada: r.fechaEntrada,
      fechaSalida: r.fechaSalida,
      guest: r.guest ? { id: r.guest.id, nombres: r.guest.nombres, apellidos: r.guest.apellidos } : null,
      room: r.room ? { id: r.room.id, numero: r.room.numero, nombre: r.room.nombre } : null,
    };
  }

  private saldoPendiente(r: Reservation) {
    const noches = Math.max(0, Math.ceil((r.fechaSalida.getTime() - r.fechaEntrada.getTime()) / DAILY_MS));
    const precioNoche = Number(r.precioBase ?? r.room?.roomType?.precioBase ?? 0);
    const totalEstancia = noches * precioNoche + (r.surcharges || []).reduce((s, x) => s + Number(x.subtotal || 0), 0);
    const totalPagado = (r.payments || []).reduce((s, p) => s + Number(p.monto || 0), 0);
    return Math.max(0, totalEstancia - Number(r.descuento || 0) - totalPagado);
  }

  private pctChange(prev: number, curr: number) {
    if (prev === 0) return { value: curr > 0 ? 100 : 0, direction: curr > 0 ? 'up' : 'flat' as const };
    const value = Math.round(((curr - prev) / prev) * 100);
    return { value: Math.abs(value), direction: value > 0 ? 'up' as const : value < 0 ? 'down' as const : 'flat' as const };
  }

  // ============ ALERTS ============

  private buildAlerts(input: {
    totalRooms: number;
    roomsByStatus: Record<string, number>;
    occupiedRooms: number;
    arrivalsToday: number;
    departuresToday: number;
    unpaidInHouse: Reservation[];
    upcoming: number;
    occupancyTrend: any[];
    currentRate: number;
  }) {
    const alerts: { type: 'info' | 'warning' | 'critical'; message: string }[] = [];
    const { roomsByStatus, occupiedRooms, arrivalsToday, departuresToday, unpaidInHouse, occupancyTrend, currentRate } = input;

    const availableRooms = Math.max(0, input.totalRooms - occupiedRooms - roomsByStatus.mantenimiento);
    if (arrivalsToday > availableRooms) {
      alerts.push({ type: 'critical', message: `Posible sobreventa: ${arrivalsToday} llegadas hoy y solo ${availableRooms} habitaciones disponibles.` });
    }
    if (roomsByStatus.mantenimiento > 0) {
      alerts.push({ type: 'warning', message: `${roomsByStatus.mantenimiento} habitación(es) en mantenimiento.` });
    }
    if (unpaidInHouse.length > 0) {
      alerts.push({ type: 'warning', message: `${unpaidInHouse.length} estadía(s) con saldo pendiente en casa.` });
    }
    if (departuresToday > 0) {
      alerts.push({ type: 'info', message: `${departuresToday} salida(s) programada(s) para hoy.` });
    }
    const nextDays = occupancyTrend.filter((d) => d.forecast);
    const avgFuture = nextDays.length ? Math.round(nextDays.reduce((s, d) => s + d.rate, 0) / nextDays.length) : currentRate;
    if (avgFuture < 40) {
      alerts.push({ type: 'info', message: `Baja ocupación proyectada los próximos 7 días (promedio ${avgFuture}%).` });
    }
    return alerts;
  }

  // ============ INSIGHTS ============

  private buildInsights(input: {
    revenue: any;
    currentRate: number;
    adrRevpar: any;
    arrivalsToday: number;
    departuresToday: number;
    occupancyTrend: any[];
    unpaidInHouse: number;
  }) {
    const insights: { tipo: 'positivo' | 'negativo' | 'neutral'; mensaje: string }[] = [];
    const { revenue, currentRate, adrRevpar, arrivalsToday, departuresToday, occupancyTrend, unpaidInHouse } = input;

    if (revenue.weekVsPrevWeek.value >= 5) {
      insights.push({ tipo: 'positivo', mensaje: `Los ingresos subieron ${revenue.weekVsPrevWeek.value}% esta semana comparado con la anterior.` });
    } else if (revenue.weekVsPrevWeek.direction === 'down' && revenue.weekVsPrevWeek.value >= 5) {
      insights.push({ tipo: 'negativo', mensaje: `Los ingresos bajaron ${revenue.weekVsPrevWeek.value}% esta semana comparado con la anterior.` });
    } else if (revenue.week > 0) {
      insights.push({ tipo: 'neutral', mensaje: `Los ingresos de la semana se mantienen estables.` });
    }

    if (currentRate >= 80) {
      insights.push({ tipo: 'positivo', mensaje: `Alta ocupación hoy: ${currentRate}% de las habitaciones ocupadas.` });
    } else if (currentRate <= 40) {
      insights.push({ tipo: 'negativo', mensaje: `Baja ocupación hoy: solo ${currentRate}% de las habitaciones ocupadas.` });
    } else {
      insights.push({ tipo: 'neutral', mensaje: `Ocupación del ${currentRate}% hoy.` });
    }

    const nextDays = occupancyTrend.filter((d) => d.forecast).slice(0, 3);
    const avgNext = nextDays.length ? Math.round(nextDays.reduce((s, d) => s + d.rate, 0) / nextDays.length) : currentRate;
    if (avgNext < 40) {
      insights.push({ tipo: 'negativo', mensaje: `Hay baja ocupación para los próximos días (promedio ${avgNext}%).` });
    } else if (avgNext >= 70) {
      insights.push({ tipo: 'positivo', mensaje: `Buena proyección de ocupación para los próximos días (${avgNext}%).` });
    }

    if (adrRevpar.adr7d > 0) {
      if (adrRevpar.adrTrend.direction === 'up') {
        insights.push({ tipo: 'positivo', mensaje: `El ADR subió ${adrRevpar.adrTrend.value}% en los últimos 7 días.` });
      } else if (adrRevpar.adrTrend.direction === 'down') {
        insights.push({ tipo: 'negativo', mensaje: `El ADR bajó ${adrRevpar.adrTrend.value}% en los últimos 7 días.` });
      } else {
        insights.push({ tipo: 'neutral', mensaje: `El ADR se mantiene en ${adrRevpar.adr7d} por habitación.` });
      }
    }

    if (arrivalsToday + departuresToday > 0) {
      insights.push({ tipo: 'neutral', mensaje: `Hoy: ${arrivalsToday} llegada(s) y ${departuresToday} salida(s).` });
    }
    if (unpaidInHouse > 0) {
      insights.push({ tipo: 'negativo', mensaje: `${unpaidInHouse} huésped(es) en casa tienen saldo pendiente por cobrar.` });
    }

    return insights;
  }

  // ============ CALENDAR ============

  async getCalendar(inicio: string, fin: string) {
    const from = new Date(inicio.slice(0, 10) + 'T00:00:00');
    const to = new Date(new Date(fin.slice(0, 10) + 'T00:00:00').getTime() + DAILY_MS);

    const [rooms, reservations, events] = await Promise.all([
      this.roomRepository.find({ relations: ['roomType'] }),
      this.reservationRepository
        .createQueryBuilder('r')
        .leftJoinAndSelect('r.room', 'room')
        .leftJoinAndSelect('room.roomType', 'roomType')
        .leftJoinAndSelect('r.guest', 'guest')
        .leftJoinAndSelect('r.payments', 'payments')
        .leftJoinAndSelect('r.surcharges', 'surcharges')
        .where('r.estado <> :cancelada', { cancelada: 'cancelada' })
        .andWhere('r.fechaSalida > :from', { from })
        .andWhere('r.fechaEntrada < :to', { to })
        .orderBy('r.fechaEntrada', 'ASC')
        .getMany(),
      this.eventRepository
        .createQueryBuilder('e')
        .where('e.fecha >= :desde', { desde: inicio.slice(0, 10) })
        .andWhere('e.fecha <= :hasta', { hasta: fin.slice(0, 10) })
        .orderBy('e.fecha', 'ASC')
        .getMany(),
    ]);

    return {
      rooms: rooms.map((r) => ({
        id: r.id,
        numero: r.numero,
        nombre: r.nombre,
        piso: r.piso,
        estado: r.estado,
        roomType: r.roomType ? { id: r.roomType.id, nombre: r.roomType.nombre, colorIdentificador: r.roomType.colorIdentificador } : null,
      })),
      reservations: reservations.map((r) => {
        const noches = Math.max(0, Math.ceil((r.fechaSalida.getTime() - r.fechaEntrada.getTime()) / DAILY_MS));
        const precioNoche = Number(r.precioBase ?? r.room?.roomType?.precioBase ?? 0);
        const totalEstancia = noches * precioNoche + (r.surcharges || []).reduce((s, x) => s + Number(x.subtotal || 0), 0);
        const totalPagado = (r.payments || []).reduce((s, p) => s + Number(p.monto || 0), 0);
        const saldoPendiente = Math.max(0, totalEstancia - Number(r.descuento || 0) - totalPagado);
        return {
          id: r.id,
          codigo: r.codigo,
          estado: r.estado,
          fechaEntrada: r.fechaEntrada,
          fechaSalida: r.fechaSalida,
          cantidadHuespedes: r.cantidadHuespedes,
          guest: r.guest ? { id: r.guest.id, nombres: r.guest.nombres, apellidos: r.guest.apellidos, documento: r.guest.documento } : null,
          room: r.room ? { id: r.room.id, numero: r.room.numero, nombre: r.room.nombre } : null,
          resumen: { noches, precioNoche, totalEstancia, totalPagado, saldoPendiente },
        };
      }),
      events,
    };
  }

  // ============ EVENTS CRUD ============

  async getEvents(desde?: string, hasta?: string) {
    const qb = this.eventRepository.createQueryBuilder('e').orderBy('e.fecha', 'ASC');
    if (desde) qb.andWhere('e.fecha >= :desde', { desde });
    if (hasta) qb.andWhere('e.fecha <= :hasta', { hasta });
    return qb.getMany();
  }

  async createEvent(dto: CreateCalendarEventDto, userId?: string) {
    const event = this.eventRepository.create({
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      fecha: dto.fecha,
      horaInicio: dto.horaInicio,
      horaFin: dto.horaFin,
      tipo: dto.tipo || 'evento',
      color: dto.color,
    });
    const saved = await this.eventRepository.save(event);

    await this.notificationsService.notifyAll({
      tipo: 'evento',
      titulo: `Nuevo evento: ${saved.titulo}`,
      mensaje: `Evento para el ${saved.fecha}${saved.horaInicio ? ` a las ${saved.horaInicio}` : ''}`,
      entidadId: saved.id,
      actorId: userId,
    });

    return saved;
  }

  async updateEvent(id: string, dto: UpdateCalendarEventDto) {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Evento no encontrado');
    if (dto.titulo !== undefined) event.titulo = dto.titulo;
    if (dto.descripcion !== undefined) event.descripcion = dto.descripcion;
    if (dto.fecha !== undefined) event.fecha = dto.fecha;
    if (dto.horaInicio !== undefined) event.horaInicio = dto.horaInicio;
    if (dto.horaFin !== undefined) event.horaFin = dto.horaFin;
    if (dto.tipo !== undefined) event.tipo = dto.tipo;
    if (dto.color !== undefined) event.color = dto.color;
    return this.eventRepository.save(event);
  }

  async deleteEvent(id: string) {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Evento no encontrado');
    await this.eventRepository.remove(event);
    return { success: true };
  }
}
