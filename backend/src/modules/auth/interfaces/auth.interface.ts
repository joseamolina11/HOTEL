export interface JwtPayload {
  sub: string;
  email: string;
  role: 'admin' | 'reception' | 'limpieza' | 'mantenimiento';
  nombres: string;
  apellidos: string;
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    nombres: string;
    apellidos: string;
    role: string;
    permissions: string[];
  };
  tokens: AuthTokens;
}
