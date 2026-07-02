import { jwtConfig } from '@/config/jwt.config';
import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/modules/auth/interfaces/auth.interface';
export const CurrentUser = createParamDecorator(
  async (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('Token requerido');
    }

    const jwtService = new JwtService({
      secret: jwtConfig.secret,
    });

    const payload = await jwtService.verifyAsync(token);

    return data ? payload[data] : payload;
  },
);
