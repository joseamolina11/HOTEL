import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function RoleGuard({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const user = useAuthStore((s) => s.user);
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export function HomeRedirect() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === 'gerencia') return <Navigate to="/dashboard-gerencial" replace />;
  return <Navigate to="/dashboard" replace />;
}
