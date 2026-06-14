export interface OperationalStats {
  totalRooms: number;
  roomsByStatus: {
    disponibles: number;
    ocupadas: number;
    reservadas: number;
    limpieza: number;
    mantenimiento: number;
  };
  today: {
    arrivals: number;
    departures: number;
  };
  activeReservations: number;
  lowStockItems: number;
}

export interface OccupancyDay {
  date: string;
  occupiedRooms: number;
  totalRooms: number;
  occupancyRate: number;
}

export interface MonthlyRevenue {
  month: number;
  roomRevenue: number;
  consumptionRevenue: number;
  total: number;
}

export interface MonthlyReservations {
  month: number;
  total: number;
  byOrigin: {
    directo: number;
    booking: number;
    airbnb: number;
  };
}
