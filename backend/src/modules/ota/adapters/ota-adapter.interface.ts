export interface OTAAdapter {
  readonly name: string;

  importReservations(fromDate?: Date): Promise<OTAImportResult>;

  updateAvailability(roomId: string, available: boolean, startDate: Date, endDate: Date): Promise<void>;

  syncInventory(): Promise<SyncResult>;

  validateCredentials(): Promise<boolean>;
}

export interface OTAImportResult {
  success: boolean;
  imported: number;
  errors: OTAImportError[];
  reservations: OTAExternalReservation[];
}

export interface OTAImportError {
  externalId: string;
  message: string;
}

export interface OTAExternalReservation {
  externalId: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  children?: number;
  roomTypeName?: string;
  observations?: string;
  totalAmount?: number;
  currency?: string;
}

export interface SyncResult {
  success: boolean;
  updated: number;
  errors: string[];
}

export interface OTACredentials {
  apiKey?: string;
  apiSecret?: string;
  clientId?: string;
  clientSecret?: string;
}
