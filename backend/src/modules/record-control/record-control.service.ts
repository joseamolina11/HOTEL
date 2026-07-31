import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Surcharge } from '../surcharges/entities/surcharge.entity';
import { RecordControlFilterDto } from './dto/record-control.dto';

@Injectable()
export class RecordControlService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
    @InjectRepository(Surcharge)
    private readonly surchargeRepo: Repository<Surcharge>,
  ) {}

  async getDeletedReservations(filters: RecordControlFilterDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.reservationRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.guest', 'guest')
      .leftJoinAndSelect('r.room', 'room')
      .leftJoinAndSelect('room.roomType', 'roomType')
      .leftJoinAndSelect('r.payments', 'payments')
      .leftJoinAndSelect('r.surcharges', 'surcharges', 'surcharges.deleted_at IS NULL')
      .where('r.estado = :estado', { estado: 'cancelada' })
      .orderBy('r.fechaEntrada', 'DESC');

    this.applyDateRange(qb, 'r.fechaEntrada', filters);

    const [rows, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data: rows.map((r) => this.mapReservation(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDeletedSurcharges(filters: RecordControlFilterDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.surchargeRepo.createQueryBuilder('s')
      .leftJoinAndSelect('s.surchargeType', 'surchargeType')
      .leftJoinAndSelect('s.tercero', 'tercero')
      .leftJoinAndSelect('s.user', 'user')
      .leftJoinAndSelect('s.reservation', 'reservation')
      .leftJoinAndSelect('reservation.guest', 'guest')
      .leftJoinAndSelect('reservation.room', 'room')
      .where('s.deleted_at IS NOT NULL')
      .orderBy('s.deletedAt', 'DESC');

    if (filters.desde) {
      qb.andWhere('s.fecha >= :desde', { desde: new Date(`${filters.desde}T00:00:00`) });
    }
    if (filters.hasta) {
      qb.andWhere('s.fecha <= :hasta', { hasta: new Date(`${filters.hasta}T23:59:59`) });
    }

    const [rows, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data: rows.map((s) => ({
        id: s.id,
        consecutivo: s.consecutivo,
        referencia: s.referencia,
        descripcion: s.descripcion,
        monto: s.monto,
        cantidad: s.cantidad,
        subtotal: s.subtotal,
        fecha: s.fecha,
        estado: s.estado,
        deletedAt: s.deletedAt,
        surchargeType: s.surchargeType,
        tercero: s.tercero,
        user: s.user,
        reservation: s.reservation
          ? {
              id: s.reservation.id,
              codigo: s.reservation.codigo,
              estado: s.reservation.estado,
              fechaEntrada: s.reservation.fechaEntrada,
              fechaSalida: s.reservation.fechaSalida,
              guest: s.reservation.guest
                ? { id: s.reservation.guest.id, nombres: s.reservation.guest.nombres, apellidos: s.reservation.guest.apellidos, documento: s.reservation.guest.documento }
                : null,
              room: s.reservation.room
                ? { id: s.reservation.room.id, numero: s.reservation.room.numero, nombre: s.reservation.room.nombre }
                : null,
            }
          : null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDiscounts(filters: RecordControlFilterDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.reservationRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.guest', 'guest')
      .leftJoinAndSelect('r.room', 'room')
      .leftJoinAndSelect('room.roomType', 'roomType')
      .leftJoinAndSelect('r.payments', 'payments')
      .leftJoinAndSelect('r.surcharges', 'surcharges', 'surcharges.deleted_at IS NULL')
      .where('r.descuento > 0')
      .orderBy('r.fechaEntrada', 'DESC');

    this.applyDateRange(qb, 'r.fechaEntrada', filters);

    const [rows, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data: rows.map((r) => this.mapReservation(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUnpaidReservations(filters: RecordControlFilterDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const having =
      '(CEIL(EXTRACT(EPOCH FROM (r.fechaSalida - r.fechaEntrada)) / 86400) * COALESCE(r.precioBase, 0) + COALESCE(SUM(s.subtotal), 0) - COALESCE(r.descuento, 0) - COALESCE(SUM(p.monto), 0)) > 0';

    const base = this.reservationRepo.createQueryBuilder('r')
      .leftJoin('r.payments', 'p')
      .leftJoin('r.surcharges', 's', 's.deleted_at IS NULL')
      .where('r.estado <> :cancelada', { cancelada: 'cancelada' });

    this.applyDateRange(base, 'r.fechaEntrada', filters);

    const pageQb = base.clone()
      .leftJoin('r.guest', 'guest')
      .leftJoin('r.room', 'room')
      .select([
        'r.id', 'r.codigo', 'r.checkinConsecutivo', 'r.estado', 'r.origen',
        'r.fechaEntrada', 'r.fechaSalida', 'r.descuento', 'r.precioBase',
        'r.cantidadHuespedes', 'r.createdAt', 'r.observaciones',
        'guest.id', 'guest.nombres', 'guest.apellidos', 'guest.documento', 'guest.telefono',
        'room.id', 'room.numero', 'room.nombre',
      ])
      .addSelect('COALESCE(SUM(p.monto), 0)', 'totalPagado')
      .addSelect('COALESCE(SUM(s.subtotal), 0)', 'totalRecargos')
      .addSelect('CEIL(EXTRACT(EPOCH FROM (r.fechaSalida - r.fechaEntrada)) / 86400)::int', 'noches')
      .groupBy('r.id')
      .addGroupBy('guest.id')
      .addGroupBy('room.id')
      .having(having)
      .orderBy('r.fechaEntrada', 'DESC')
      .skip(skip)
      .take(limit);

    const rows = await pageQb.getRawMany();

    const countQb = base.clone()
      .select('r.id')
      .groupBy('r.id')
      .having(having);

    const countRows = await countQb.getRawMany();
    const total = countRows.length;

    return {
      data: rows.map((row: any) => {
        const precioNoche = Number(row.r_precioBase ?? 0);
        const noches = Number(row.noches || 0);
        const totalHabitacion = noches * precioNoche;
        const totalRecargos = Number(row.totalRecargos || 0);
        const totalEstancia = totalHabitacion + totalRecargos;
        const totalPagado = Number(row.totalPagado || 0);
        const descuento = Number(row.r_descuento || 0);
        const saldoPendiente = Math.max(0, totalEstancia - descuento - totalPagado);
        return {
          id: row.r_id,
          codigo: row.r_codigo,
          checkinConsecutivo: row.r_checkinConsecutivo,
          estado: row.r_estado,
          origen: row.r_origen,
          fechaEntrada: row.r_fechaEntrada,
          fechaSalida: row.r_fechaSalida,
          createdAt: row.r_createdAt,
          observaciones: row.r_observaciones,
          cantidadHuespedes: row.r_cantidadHuespedes,
          descuento,
          guest: row.guest_id
            ? {
                id: row.guest_id,
                nombres: row.guest_nombres,
                apellidos: row.guest_apellidos,
                documento: row.guest_documento,
                telefono: row.guest_telefono,
              }
            : null,
          room: row.room_id
            ? { id: row.room_id, numero: row.room_numero, nombre: row.room_nombre }
            : null,
          resumen: {
            noches,
            precioPorNoche: precioNoche,
            totalHabitacion,
            totalRecargos,
            totalEstancia,
            totalPagado,
            descuento,
            saldoPendiente,
          },
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private mapReservation(r: Reservation) {
    const noches = Math.max(0, Math.ceil(
      (new Date(r.fechaSalida).getTime() - new Date(r.fechaEntrada).getTime()) /
        (1000 * 60 * 60 * 24),
    ));
    const precioNoche = Number(r.precioBase ?? r.room?.roomType?.precioBase ?? 0);
    const totalHabitacion = noches * precioNoche;
    const totalRecargos = (r.surcharges || []).reduce((sum, s) => sum + Number(s.subtotal || 0), 0);
    const totalEstancia = totalHabitacion + totalRecargos;
    const totalPagado = (r.payments || []).reduce((sum, p) => sum + Number(p.monto || 0), 0);
    const descuento = Number(r.descuento || 0);
    const saldoPendiente = Math.max(0, totalEstancia - descuento - totalPagado);
    return {
      id: r.id,
      codigo: r.codigo,
      checkinConsecutivo: r.checkinConsecutivo,
      estado: r.estado,
      origen: r.origen,
      fechaEntrada: r.fechaEntrada,
      fechaSalida: r.fechaSalida,
      createdAt: r.createdAt,
      observaciones: r.observaciones,
      cantidadHuespedes: r.cantidadHuespedes,
      descuento,
      guest: r.guest
        ? {
            id: r.guest.id,
            nombres: r.guest.nombres,
            apellidos: r.guest.apellidos,
            documento: r.guest.documento,
            telefono: r.guest.telefono,
          }
        : null,
      room: r.room
        ? { id: r.room.id, numero: r.room.numero, nombre: r.room.nombre }
        : null,
      resumen: {
        noches,
        precioPorNoche: precioNoche,
        totalHabitacion,
        totalRecargos,
        totalEstancia,
        totalPagado,
        descuento,
        saldoPendiente,
      },
    };
  }

  private applyDateRange(qb: any, column: string, filters: RecordControlFilterDto) {
    if (filters.desde) {
      qb.andWhere(`${column} >= :desde`, { desde: new Date(`${filters.desde}T00:00:00`) });
    }
    if (filters.hasta) {
      qb.andWhere(`${column} <= :hasta`, { hasta: new Date(`${filters.hasta}T23:59:59`) });
    }
  }
}
