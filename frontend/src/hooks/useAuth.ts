import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { LoginCredentials } from '@/types/auth.types';
import { toastSuccess } from '@/lib/notifications';

export function useLogin() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (response) => {
      login(response.user, response.tokens.accessToken, response.tokens.refreshToken);
      toastSuccess(`Bienvenido, ${response.user.nombres}`);
      navigate('/dashboard');
    },
  });
}

export function useLogout() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  return useMutation({
    mutationFn: () => authApi.logout(refreshToken || ''),
    onSettled: () => {
      logout();
      navigate('/login');
    },
  });
}
