export interface JwtPayload {
  sub: string;
  email: string;
  role: 'admin' | 'reception';
  nombres: string;
  apellidos: string;
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
  };
  tokens: AuthTokens;
}
