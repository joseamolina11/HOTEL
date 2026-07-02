import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';
import { toastError, showSessionExpired } from '@/lib/notifications';

const apiClient = axios.create({
  baseURL: 'https://intranet.cytech.net.co:4000' + '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login')) {
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${apiClient.defaults.baseURL}/auth/refresh`,
            { refreshToken },
          );
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          useAuthStore.getState().setTokens(accessToken, newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } catch {
          useAuthStore.getState().logout();
          showSessionExpired();
          setTimeout(() => { window.location.href = '/login'; }, 2000);
          return Promise.reject(error);
        }
      } else {
        useAuthStore.getState().logout();
        showSessionExpired();
        setTimeout(() => { window.location.href = '/login'; }, 2000);
        return Promise.reject(error);
      }
    }

    const message = error.response?.data?.error?.message
      || error.response?.data?.message
      || error.message
      || 'Error inesperado';

    if (error.response?.status !== 401 && !originalRequest.url?.includes('/auth/login')) {
      toastError(message);
    }

    return Promise.reject(error);
  },
);

export default apiClient;
