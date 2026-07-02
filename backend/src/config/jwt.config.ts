import { JwtModuleOptions } from '@nestjs/jwt';

export const jwtConfig: JwtModuleOptions = {
  secret: process.env.JWT_SECRET || 'hotel-pms-secret-key-dev',
  signOptions: {
    expiresIn: process.env.JWT_EXPIRATION || '24h',
  },
};

export const jwtRefreshConfig = {
  secret: process.env.JWT_REFRESH_SECRET || 'hotel-pms-refresh-secret-dev',
  expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
};
