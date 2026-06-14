import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';
import {
  OTAAdapter,
  OTAImportResult,
  SyncResult,
  OTACredentials,
} from './ota-adapter.interface';

/**
 * Airbnb API Adapter
 *
 * Documentación oficial:
 * - API: https://api.airbnb.com/v2
 * - Documentación para socios: https://www.airbnb.com/partner
 * - Autenticación: OAuth 2.0 (Client Credentials Flow)
 *
 * Endpoints principales:
 * - GET /v2/reservations            → Listar/importar reservas
 * - POST /v2/ listings/:id/calendar → Actualizar disponibilidad
 * - POST /v2/ listings/:id/pricing  → Actualizar tarifas
 *
 * NOTA: Airbnb requiere:
 * 1. Ser socio oficial de Airbnb (Airbnb Partner)
 * 2. Registro como "Software Partner"
 * 3. OAuth 2.0 con Client ID + Client Secret
 * 4. API Client Agreement firmado
 */
@Injectable()
export class AirbnbAdapter implements OTAAdapter {
  readonly name = 'airbnb';
  private readonly logger = new Logger(AirbnbAdapter.name);
  private credentials: OTACredentials = {};
  private baseUrl = process.env.AIRBNB_API_URL || 'https://api.airbnb.com/v2';

  setCredentials(credentials: OTACredentials) {
    this.credentials = credentials;
  }

  async importReservations(fromDate?: Date): Promise<OTAImportResult> {
    this.logger.log('Importando reservas desde Airbnb...');

    if (!this.credentials.clientId) {
      this.logger.warn('Airbnb no configurado - devolviendo resultado vacío');
      return {
        success: true,
        imported: 0,
        errors: [],
        reservations: [],
      };
    }

    try {
      let path = '/reservations';
      const params = new URLSearchParams();
      if (fromDate) {
        params.append('updated_at[gte]', fromDate.toISOString());
      }
      params.append('page_size', '50');
      const queryString = params.toString();
      if (queryString) path += `?${queryString}`;

      const data = await this.makeRequest(path);
      return this.parseReservations(data);
    } catch (error) {
      this.logger.error('Error importando reservas de Airbnb', error);
      return {
        success: false,
        imported: 0,
        errors: [{ externalId: 'unknown', message: error.message }],
        reservations: [],
      };
    }
  }

  async updateAvailability(
    listingId: string,
    available: boolean,
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    if (!this.credentials.clientId) {
      this.logger.warn('Airbnb no configurado - sincronización omitida');
      return;
    }

    try {
      const body = JSON.stringify({
        listing_id: listingId,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        availability: available ? 'available' : 'blocked',
      });

      await this.makeRequest(`/listings/${listingId}/calendar`, {
        method: 'POST',
        body,
      });

      this.logger.log(
        `Disponibilidad actualizada en Airbnb: listing=${listingId} available=${available}`,
      );
    } catch (error) {
      this.logger.error('Error actualizando disponibilidad en Airbnb', error);
      throw error;
    }
  }

  async syncInventory(): Promise<SyncResult> {
    this.logger.log('Sincronizando inventario con Airbnb...');
    return { success: true, updated: 0, errors: [] };
  }

  async validateCredentials(): Promise<boolean> {
    if (!this.credentials.clientId) return false;

    try {
      await this.makeRequest('/me', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  private async getAccessToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      const tokenBody = JSON.stringify({
        grant_type: 'client_credentials',
        client_id: this.credentials.clientId,
        client_secret: this.credentials.clientSecret,
      });

      const req = https.request(
        {
          hostname: 'api.airbnb.com',
          path: '/v2/oauth/token',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(tokenBody).toString(),
          },
          timeout: 5000,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed.access_token);
            } catch {
              reject(new Error('Error obteniendo token de Airbnb'));
            }
          });
        },
      );

      req.on('error', reject);
      req.write(tokenBody);
      req.end();
    });
  }

  private async makeRequest(
    path: string,
    options?: { method?: string; body?: string; timeout?: number },
  ): Promise<any> {
    const token = await this.getAccessToken();
    const url = new URL(this.baseUrl + path);

    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: url.hostname,
          path: url.pathname + url.search,
          method: options?.method || 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Airbnb-API-Key': this.credentials.clientId || '',
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
              reject(new Error(`Airbnb API error: ${res.statusCode} ${data}`));
            }
          });
        },
      );

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Airbnb API timeout'));
      });

      if (options?.body) {
        req.write(options.body);
      }
      req.end();
    });
  }

  private parseReservations(data: any): OTAImportResult {
    try {
      const reservations: any[] = data?.reservations || data?.listings || [];

      if (data?.reservations && Array.isArray(data.reservations)) {
        return {
          success: true,
          imported: data.reservations.length,
          errors: [],
          reservations: data.reservations.map((r: any) => ({
            externalId: r.id?.toString() || r.confirmation_code || '',
            guestName: r.guest?.name || r.guest_name || '',
            guestEmail: r.guest?.email,
            guestPhone: r.guest?.phone,
            checkIn: new Date(r.check_in || r.start_date),
            checkOut: new Date(r.check_out || r.end_date),
            adults: parseInt(r.adults || r.number_of_guests || '1', 10),
            children: parseInt(r.children || '0', 10),
            roomTypeName: r.listing?.name || r.listing_name,
            observations: r.note || r.notes,
            totalAmount: parseFloat(r.payout_amount || r.total_amount || '0'),
            currency: r.currency || 'USD',
          })),
        };
      }

      return { success: true, imported: 0, errors: [], reservations: [] };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [{ externalId: 'parse', message: 'Error parsing Airbnb response' }],
        reservations: [],
      };
    }
  }
}
