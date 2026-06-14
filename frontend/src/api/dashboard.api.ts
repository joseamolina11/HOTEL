import apiClient from './client';
import { OperationalStats, MonthlyRevenue, MonthlyReservations } from '@/types/dashboard.types';

export const dashboardApi = {
  getStats: async (): Promise<OperationalStats> => {
    const { data } = await apiClient.get('/dashboard/stats');
    return data.data;
  },

  getRevenue: async (year?: number) => {
    const { data } = await apiClient.get('/dashboard/revenue', {
      params: { year },
    });
    return data.data;
  },

  getReservationsByMonth: async (year?: number) => {
    const { data } = await apiClient.get('/dashboard/reservations-by-month', {
      params: { year },
    });
    return data.data;
  },
};
