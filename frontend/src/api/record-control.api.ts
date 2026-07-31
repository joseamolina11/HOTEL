import apiClient from './client';

export type RecordControlType =
  | 'deleted-reservations'
  | 'deleted-surcharges'
  | 'discounts'
  | 'unpaid-reservations';

const ENDPOINTS: Record<RecordControlType, string> = {
  'deleted-reservations': '/record-control/deleted-reservations',
  'deleted-surcharges': '/record-control/deleted-surcharges',
  discounts: '/record-control/discounts',
  'unpaid-reservations': '/record-control/unpaid-reservations',
};

export const recordControlApi = {
  findAll: async (type: RecordControlType, params?: Record<string, string>) => {
    const { data } = await apiClient.get(ENDPOINTS[type], { params });
    return data?.data ?? data;
  },
};
