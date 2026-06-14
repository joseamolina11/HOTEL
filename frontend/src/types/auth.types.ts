export interface User {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  role: 'admin' | 'reception';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}
