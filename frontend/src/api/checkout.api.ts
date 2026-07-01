import apiClient from './client';

export interface CheckOutDto {
  reservationId: string;
  observaciones?: string;
  payments?: { monto: number; metodoPagoId: string; comprobante?: string }[];
}

export interface PendingCheckOuts {
  todayDepartures: any[];
  allCheckedIn: any[];
}

export interface StaySummary {
  reservation: any;
  hotelConfig: {
    nombre?: string;
    direccion?: string;
    ciudad?: string;
    pais?: string;
    telefono?: string;
    email?: string;
    logo?: string;
  } | null;
  summary: {
    noches: number;
    precioPorNoche: number;
    totalHabitacion: number;
    consumos: any[];
    totalConsumos: number;
    pedidos: any[];
    totalPedidos: number;
    payments: any[];
    totalPagado: number;
    totalEstancia: number;
    saldoPendiente: number;
  };
}

export const checkoutApi = {
  findPending: async (): Promise<PendingCheckOuts> => {
    const { data } = await apiClient.get('/check-out/pending');
    return data.data;
  },

  getStaySummary: async (reservationId: string): Promise<StaySummary> => {
    const { data } = await apiClient.get(`/check-out/${reservationId}`);
    return data.data;
  },

  checkOut: async (dto: CheckOutDto) => {
    const { data } = await apiClient.post('/check-out', dto);
    return data.data;
  },
};
