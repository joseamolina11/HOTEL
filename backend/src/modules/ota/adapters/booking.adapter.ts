import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';
import {
  OTAAdapter,
  OTAImportResult,
  SyncResult,
  OTACredentials,
} from './ota-adapter.interface';

/**
 * Booking.com API Adapter
 *
 * Documentación oficial:
 * - API: https://distribution-xml.booking.com
 * - Documentación: https://developers.booking.com
 * - Autenticación: Basic Auth con API Key + API Secret
 *
 * Endpoints principales:
 * - GET /xml/ota/hotelresnotif   → Importar reservas
 * - GET /xml/ota/hotelavailnotif → Actualizar disponibilidad
 * - GET /xml/ota/hotelrateplan   → Actualizar tarifas
 *
 * NOTA: Booking.com requiere:
 * 1. Contrato activo de distribución
 * 2. Conexión vía XML/OTA (HTTPS + Basic Auth)
 * 3. Credenciales proporcionadas por Booking.com
 * 4. IP del servidor registrada en whitelist
 */
@Injectable()
export class BookingAdapter implements OTAAdapter {
  readonly name = 'booking';
  private readonly logger = new Logger(BookingAdapter.name);
  private credentials: OTACredentials = {};
  private baseUrl = process.env.BOOKING_API_URL || 'https://distribution-xml.booking.com';

  setCredentials(credentials: OTACredentials) {
    this.credentials = credentials;
  }

  async importReservations(fromDate?: Date): Promise<OTAImportResult> {
    this.logger.log('Importando reservas desde Booking.com...');

    if (!this.credentials.apiKey) {
      this.logger.warn('Booking.com no configurado - devolviendo resultado vacío');
      return {
        success: true,
        imported: 0,
        errors: [],
        reservations: [],
      };
    }

    try {
      const path = '/xml/ota/hotelresnotif';
      const params = fromDate ? `?from=${fromDate.toISOString().split('T')[0]}` : '';
      const data = await this.makeRequest(path + params);
      return this.parseReservations(data);
    } catch (error) {
      this.logger.error('Error importando reservas de Booking.com', error);
      return {
        success: false,
        imported: 0,
        errors: [{ externalId: 'unknown', message: error.message }],
        reservations: [],
      };
    }
  }

  async updateAvailability(
    roomId: string,
    available: boolean,
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    if (!this.credentials.apiKey) {
      this.logger.warn('Booking.com no configurado - sincronización omitida');
      return;
    }

    try {
      const body = JSON.stringify({
        roomId,
        available,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      await this.makeRequest('/xml/ota/hotelavailnotif', {
        method: 'POST',
        body,
      });

      this.logger.log(
        `Disponibilidad actualizada en Booking.com: room=${roomId} available=${available}`,
      );
    } catch (error) {
      this.logger.error('Error actualizando disponibilidad en Booking.com', error);
      throw error;
    }
  }

  async syncInventory(): Promise<SyncResult> {
    this.logger.log('Sincronizando inventario con Booking.com...');
    return { success: true, updated: 0, errors: [] };
  }

  async validateCredentials(): Promise<boolean> {
    if (!this.credentials.apiKey) return false;

    try {
      await this.makeRequest('/json/ota/hotelresnotif', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  private makeRequest(
    path: string,
    options?: { method?: string; body?: string; timeout?: number },
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const auth = Buffer.from(
        `${this.credentials.apiKey}:${this.credentials.apiSecret || ''}`,
      ).toString('base64');

      const req = https.request(
        {
          hostname: new URL(this.baseUrl).hostname,
          path,
          method: options?.method || 'GET',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
            ...(options?.body ? { 'Content-Length': Buffer.byteLength(options.body).toString() } : {}),
          },
          timeout: options?.timeout || 10000,
          rejectUnauthorized: true,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                resolve(JSON.parse(data));
              } catch {
                resolve(data);
              }
            } else {
              reject(new Error(`Booking.com API error: ${res.statusCode} ${data}`));
            }
          });
        },
      );

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Booking.com API timeout'));
      });

      if (options?.body) {
        req.write(options.body);
      }
      req.end();
    });
  }

  private parseReservations(data: any): OTAImportResult {
    try {
      const reservations: any[] = data?.reservations || data?.hotelReservations || [];
      return {
        success: true,
        imported: reservations.length,
        errors: [],
        reservations: reservations.map((r: any) => ({
          externalId: r.id?.toString() || r.reservation_id?.toString() || '',
          guestName: r.guest?.name || r.guest_name || '',
          guestEmail: r.guest?.email || r.guest_email,
          guestPhone: r.guest?.phone || r.guest_phone,
          checkIn: new Date(r.checkin || r.arrival_date || r.check_in),
          checkOut: new Date(r.checkout || r.departure_date || r.check_out),
          adults: parseInt(r.adults || r.number_of_adults || '1', 10),
          children: parseInt(r.children || r.number_of_children || '0', 10),
          roomTypeName: r.room_type || r.room_type_name,
          observations: r.remarks || r.special_requests || r.observations,
          totalAmount: parseFloat(r.total_amount || r.amount || '0'),
          currency: r.currency || 'EUR',
        })),
      };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [{ externalId: 'parse', message: 'Error parsing Booking.com response' }],
        reservations: [],
      };
    }
  }
}
