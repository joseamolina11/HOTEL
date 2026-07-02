import { IsString, IsOptional, IsBoolean, IsEnum, IsEmail, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@hotel.com' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  nombres: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  apellidos: string;

  @ApiPropertyOptional({ enum: ['admin', 'reception', 'limpieza', 'mantenimiento'] })
  @IsOptional()
  role?: 'admin' | 'reception' | 'limpieza' | 'mantenimiento';
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nombres?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apellidos?: string;

  @ApiPropertyOptional({ enum: ['admin', 'reception', 'limpieza', 'mantenimiento'] })
  @IsOptional()
  @IsEnum(['admin', 'reception', 'limpieza', 'mantenimiento'])
  role?: 'admin' | 'reception' | 'limpieza' | 'mantenimiento';

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
