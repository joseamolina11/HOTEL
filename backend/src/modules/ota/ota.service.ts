import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingAdapter } from './adapters/booking.adapter';
import { AirbnbAdapter } from './adapters/airbnb.adapter';
import { OTAAdapter, OTACredentials } from './adapters/ota-adapter.interface';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Room } from '../rooms/entities/room.entity';
import { generateReservationCode } from 'src/common/utils/generate-code';

@Injectable()
export class OtaService {
  private readonly logger = new Logger(OtaService.name);
  private adapters: Map<string, OTAAdapter> = new Map();

  constructor(
    private readonly bookingAdapter: BookingAdapter,
    private readonly airbnbAdapter: AirbnbAdapter,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {
    this.adapters.set('booking', bookingAdapter);
    this.adapters.set('airbnb', airbnbAdapter);
  }

  async importReservations(source: 'booking' | 'airbnb') {
    const adapter = this.adapters.get(source);
    if (!adapter) {
      throw new BadRequestException(`Adaptador OTA no encontrado: ${source}`);
    }

    this.logger.log(`Iniciando importación desde ${source}...`);
    const result = await adapter.importReservations();

    if (!result.success) {
      return { success: false, errors: result.errors, imported: 0 };
    }

    const importedReservations = [];

    for (const externalReservation of result.reservations) {
      try {
        const existing = await this.reservationRepository.findOne({
          where: { otaReservationId: externalReservation.externalId },
        });

        if (existing) {
          this.logger.log(`Reserva ${externalReservation.externalId} ya existe, omitiendo`);
          continue;
        }

        const room = await this.findMatchingRoom(externalReservation.roomTypeName);
        if (!room) {
          this.logger.warn(`No se encontró habitación para reserva OTA: ${externalReservation.externalId}`);
          continue;
        }

        const codigo = generateReservationCode();
        // @ts-ignore
        const reservation: Partial<Reservation> = this.reservationRepository.create({
          codigo,
          roomId: room.id,
          guestId: null,
          fechaEntrada: externalReservation.checkIn,
          fechaSalida: externalReservation.checkOut,
          cantidadHuespedes: externalReservation.adults + (externalReservation.children || 0),
          observaciones: externalReservation.observations || `Importada de ${source}`,
          estado: 'confirmada',
          origen: source,
          otaReservationId: externalReservation.externalId,
        });

        const saved = await this.reservationRepository.save(reservation);
        await this.roomRepository.update(room.id, { estado: 'reservada' });

        importedReservations.push(saved);
        this.logger.log(`Reserva importada de ${source}: ${externalReservation.externalId}`);
      } catch (error) {
        this.logger.error(`Error importando reserva ${externalReservation.externalId}`, error);
        result.errors.push({
          externalId: externalReservation.externalId,
          message: (error as Error).message,
        });
      }
    }

    return {
      success: true,
      imported: importedReservations.length,
      total: result.reservations.length,
      errors: result.errors,
      reservations: importedReservations,
    };
  }

  async syncAvailability(
    roomId: string,
    available: boolean,
    startDate: Date,
    endDate: Date,
  ) {
    const results: Record<string, any> = {};

    for (const [name, adapter] of this.adapters) {
      try {
        await adapter.updateAvailability(roomId, available, startDate, endDate);
        results[name] = { success: true };
      } catch (error) {
        results[name] = { success: false, error: (error as Error).message };
      }
    }

    return { roomId, available, startDate, endDate, results };
  }

  async getConnectionStatus() {
    const status: Record<string, any> = {};

    for (const [name, adapter] of this.adapters) {
      try {
        const valid = await adapter.validateCredentials();
        status[name] = {
          configured: true,
          connected: valid,
          lastSync: null,
        };
      } catch {
        status[name] = {
          configured: true,
          connected: false,
          lastSync: null,
        };
      }
    }

    return status;
  }

  async configure(config: OTACredentials) {
    if (config.apiKey) {
      this.bookingAdapter.setCredentials({
        apiKey: config.apiKey,
        apiSecret: config.apiSecret,
      });
    }
    if (config.clientId) {
      this.airbnbAdapter.setCredentials({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
      });
    }
    return { message: 'Credenciales OTA actualizadas correctamente' };
  }

  private async findMatchingRoom(roomTypeName?: string): Promise<Room | null> {
    if (!roomTypeName) {
      return this.roomRepository.findOne({
        where: { estado: 'disponible' },
        order: { createdAt: 'ASC' },
        relations: ['roomType'],
      });
    }

    const room = await this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.roomType', 'roomType')
      .where('room.estado = :estado', { estado: 'disponible' })
      .andWhere(
        '(LOWER(roomType.nombre) LIKE LOWER(:name) OR LOWER(room.nombre) LIKE LOWER(:name))',
        { name: `%${roomTypeName}%` },
      )
      .getOne();

    return room || null;
  }
}
