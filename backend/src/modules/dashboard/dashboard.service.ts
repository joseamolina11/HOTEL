import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Room } from '../rooms/entities/room.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { Consumption } from '../consumptions/entities/consumption.entity';
import { getMonthRange, getTodayRange } from 'src/common/utils/date-utils';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(InventoryItem)
    private readonly inventoryItemRepository: Repository<InventoryItem>,
    @InjectRepository(Consumption)
    private readonly consumptionRepository: Repository<Consumption>,
  ) {}

  async getOperationalStats() {
    const totalRooms = await this.roomRepository.count();
    const roomsByStatus = await this.roomRepository
      .createQueryBuilder('room')
      .select('room.estado', 'estado')
      .addSelect('COUNT(room.id)', 'count')
      .groupBy('room.estado')
      .getRawMany();

    const today = getTodayRange();
    const arrivals = await this.reservationRepository.count({
      where: {
        fechaEntrada: Between(today.start, today.end),
        estado: 'confirmada',
      },
    });

    const departures = await this.reservationRepository.count({
      where: {
        fechaSalida: Between(today.start, today.end),
        estado: 'checkin',
      },
    });

    const activeReservations = await this.reservationRepository.count({
      where: { estado: 'checkin' },
    });

    const lowStockItems = await this.inventoryItemRepository
      .createQueryBuilder('item')
      .where('item.stockActual <= item.stockMinimo')
      .getCount();

    const statsMap: Record<string, number> = {};
    roomsByStatus.forEach((r: any) => { statsMap[r.estado] = parseInt(r.count, 10); });

    return {
      totalRooms,
      roomsByStatus: {
        disponibles: statsMap['disponible'] || 0,
        ocupadas: statsMap['ocupada'] || 0,
        reservadas: statsMap['reservada'] || 0,
        limpieza: statsMap['limpieza'] || 0,
        mantenimiento: statsMap['mantenimiento'] || 0,
      },
      today: {
        arrivals,
        departures,
      },
      activeReservations,
      lowStockItems,
    };
  }

  async getMonthlyOccupancy(year?: number, month?: number) {
    const currentDate = new Date();
    const targetYear = year || currentDate.getFullYear();
    const targetMonth = month || currentDate.getMonth() + 1;
    const totalRooms = await this.roomRepository.count();
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    const occupancyData = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStart = new Date(targetYear, targetMonth - 1, day);
      const dayEnd = new Date(targetYear, targetMonth - 1, day + 1);

      const occupiedRooms = await this.reservationRepository
        .createQueryBuilder('reservation')
        .where('reservation.estado IN (:...statuses)', {
          statuses: ['checkin', 'checkout'],
        })
        .andWhere('reservation.fechaEntrada <= :dayEnd', { dayEnd })
        .andWhere('reservation.fechaSalida >= :dayStart', { dayStart })
        .getCount();

      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

      occupancyData.push({
        date: `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        occupiedRooms,
        totalRooms,
        occupancyRate,
      });
    }

    return {
      year: targetYear,
      month: targetMonth,
      data: occupancyData,
    };
  }

  async getMonthlyRevenue(year?: number) {
    const targetYear = year || new Date().getFullYear();
    const monthlyRevenue = [];

    for (let month = 1; month <= 12; month++) {
      const { start, end } = getMonthRange(targetYear, month);

      const consumptions = await this.consumptionRepository
        .createQueryBuilder('consumption')
        .innerJoin('consumption.reservation', 'reservation')
        .where('reservation.estado = :estado', { estado: 'checkout' })
        .andWhere('reservation.fechaSalida >= :start', { start })
        .andWhere('reservation.fechaSalida <= :end', { end })
        .select('SUM(consumption.subtotal)', 'total')
        .getRawOne();

      const rooms = await this.reservationRepository
        .createQueryBuilder('reservation')
        .innerJoin('reservation.room', 'room')
        .innerJoin('room.roomType', 'roomType')
        .where('reservation.estado = :estado', { estado: 'checkout' })
        .andWhere('reservation.fechaSalida >= :start', { start })
        .andWhere('reservation.fechaSalida <= :end', { end })
        .select([
          'roomType.precioBase AS precio_base',
          'EXTRACT(DAY FROM reservation.fechaSalida - reservation.fechaEntrada) AS noches',
        ])
        .getRawMany();

      let roomRevenue = 0;
      rooms.forEach((r: any) => {
        roomRevenue += Number(r.precio_base) * (Number(r.noches) || 1);
      });

      monthlyRevenue.push({
        month,
        roomRevenue: Math.round(roomRevenue * 100) / 100,
        consumptionRevenue: Math.round(Number(consumptions?.total || 0) * 100) / 100,
        total: Math.round((roomRevenue + Number(consumptions?.total || 0)) * 100) / 100,
      });
    }

    return { year: targetYear, data: monthlyRevenue };
  }

  async getReservationsByMonth(year?: number) {
    const targetYear = year || new Date().getFullYear();
    const monthlyReservations = [];

    for (let month = 1; month <= 12; month++) {
      const { start, end } = getMonthRange(targetYear, month);

      const byOrigin = await this.reservationRepository
        .createQueryBuilder('reservation')
        .select('reservation.origen', 'origen')
        .addSelect('COUNT(reservation.id)', 'count')
        .where('reservation.createdAt >= :start', { start })
        .andWhere('reservation.createdAt <= :end', { end })
        .groupBy('reservation.origen')
        .getRawMany();

      const total = byOrigin.reduce((sum: number, r: any) => sum + parseInt(r.count, 10), 0);
      const originMap: Record<string, number> = { directo: 0, booking: 0, airbnb: 0 };
      byOrigin.forEach((r: any) => { originMap[r.origen] = parseInt(r.count, 10); });

      monthlyReservations.push({
        month,
        total,
        byOrigin: originMap,
      });
    }

    return { year: targetYear, data: monthlyReservations };
  }
}
