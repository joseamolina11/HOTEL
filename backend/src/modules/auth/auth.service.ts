import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload, LoginResponse, AuthTokens } from './interfaces/auth.interface';
import { jwtRefreshConfig } from 'src/config/jwt.config';
import { PermissionsService } from 'src/modules/permissions/permissions.service';

@Injectable()
export class AuthService {
  private refreshTokensStore = new Map<string, { userId: string; expiresAt: Date }>();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.activo) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const permissions = await this.permissionsService.getPermissionsForRole(user.role);
    const tokens = await this.generateTokens(user, permissions);

    return {
      user: {
        id: user.id,
        email: user.email,
        nombres: user.nombres,
        apellidos: user.apellidos,
        role: user.role,
        permissions,
      },
      tokens,
    };
  }

  async register(registerDto: RegisterDto): Promise<LoginResponse> {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = this.userRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      nombres: registerDto.nombres,
      apellidos: registerDto.apellidos,
      role: registerDto.role || 'reception',
    });

    await this.userRepository.save(user);

    const permissions = await this.permissionsService.getPermissionsForRole(user.role);
    const tokens = await this.generateTokens(user, permissions);

    return {
      user: {
        id: user.id,
        email: user.email,
        nombres: user.nombres,
        apellidos: user.apellidos,
        role: user.role,
        permissions,
      },
      tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: jwtRefreshConfig.secret,
      });

      const storedToken = this.refreshTokensStore.get(refreshToken);
      if (!storedToken || storedToken.userId !== payload.sub) {
        throw new UnauthorizedException('Refresh token inválido');
      }

      this.refreshTokensStore.delete(refreshToken);

      const user = await this.userRepository.findOne({
        where: { id: payload.sub, activo: true },
      });

      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      return this.generateTokens(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    this.refreshTokensStore.delete(refreshToken);
    return { message: 'Sesión cerrada exitosamente' };
  }

  private async generateTokens(user: User, permissions?: string[]): Promise<AuthTokens> {
    const perms = permissions || await this.permissionsService.getPermissionsForRole(user.role);
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      nombres: user.nombres,
      apellidos: user.apellidos,
      permissions: perms,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: jwtRefreshConfig.secret,
      expiresIn: jwtRefreshConfig.expiresIn,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    this.refreshTokensStore.set(refreshToken, {
      userId: user.id,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }
}
