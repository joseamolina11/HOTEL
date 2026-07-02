import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle, WifiOff, ServerCrash, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useState, useMemo } from 'react';
import { AxiosError } from 'axios';

const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

function getLoginError(error: unknown): { message: string; icon: typeof AlertCircle } | null {
  if (!error) return null;
  const axiosError = error as AxiosError<{ message?: string }>;

  if (axiosError.response) {
    const status = axiosError.response.status;
    const serverMsg = axiosError.response.data?.message;

    if (status === 401) {
      return {
        message: serverMsg || 'Credenciales inválidas. Verifica tu correo y contraseña.',
        icon: AlertCircle,
      };
    }
    if (status >= 500) {
      return {
        message: 'Error en el servidor. Intenta de nuevo más tarde.',
        icon: ServerCrash,
      };
    }
    return {
      message: serverMsg || 'Ocurrió un error inesperado. Intenta de nuevo.',
      icon: AlertCircle,
    };
  }

  if (axiosError.code === 'ERR_NETWORK' || !axiosError.response) {
    return {
      message: 'No se puede conectar con el servidor. Verifica tu conexión e intenta de nuevo.',
      icon: WifiOff,
    };
  }

  return {
    message: 'Ocurrió un error inesperado. Intenta de nuevo.',
    icon: AlertCircle,
  };
}

export function LoginPage() {
  const login = useLogin();
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const loginError = useMemo(() => getLoginError(login.error), [login.error]);
  const ErrorIcon = loginError?.icon ?? AlertCircle;

  return (
    <div className="flex min-h-screen">
      {/* Left — Branding */}
      <div className="relative hidden w-1/2 lg:flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-12">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/5 blur-2xl" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
            <img src="/logo-blanco.png" alt="Hotel Luxury VIP" className="h-16 w-16 object-contain" />
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-white">Hotel Luxury VIP</h1>
          <p className="mb-8 max-w-sm text-lg text-white/60">Sistema de gestión hotelera todo en uno</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/40">
            <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary/60" />Reservas</span>
            <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary/60" />Facturación</span>
            <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary/60" />Inventario</span>
          </div>
        </div>

        <p className="absolute bottom-8 z-10 text-xs text-white/20">© 2026 Hotel Luxury VIP. Todos los derechos reservados.</p>
      </div>

      {/* Right — Form */}
      <div className="flex w-full items-center justify-center bg-background p-6 lg:w-1/2">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile logo */}
          <div className="mb-10 flex flex-col items-center lg:hidden">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
              <img src="/logo-negro.png" alt="Hotel Luxury VIP" className="h-10 w-10 object-contain" />
            </div>
            <h1 className="text-xl font-bold">Hotel Luxury VIP</h1>
            <p className="text-sm text-muted-foreground">Inicia sesión para continuar</p>
          </div>

          {/* Desktop header */}
          <div className="mb-8 hidden lg:block">
            <h2 className="text-2xl font-bold tracking-tight">Bienvenido</h2>
            <p className="mt-1 text-muted-foreground">Ingresa tus credenciales para acceder al sistema</p>
          </div>

          <form onSubmit={handleSubmit((data) => login.mutate(data))} className="space-y-5">
            {loginError && (
              <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-fade-in">
                <ErrorIcon className="h-5 w-5 shrink-0" />
                <span>{loginError.message}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Correo electrónico</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="admin@hotel.com"
                  className="h-11 pl-10"
                  autoFocus
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="flex items-center gap-1 text-xs text-destructive"><AlertCircle className="h-3 w-3" />{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Contraseña</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••"
                  className="h-11 pl-10 pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="flex items-center gap-1 text-xs text-destructive"><AlertCircle className="h-3 w-3" />{errors.password.message}</p>}
            </div>

            <Button type="submit" className="h-11 w-full text-base font-medium" disabled={login.isPending}>
              {login.isPending ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Iniciando sesión...</>
              ) : (
                'Iniciar sesión'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
