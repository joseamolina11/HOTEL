import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'admin@hotel.com' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiProperty({ example: 'Admin123' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({ example: 'Admin' })
  @IsString()
  nombres: string;

  @ApiProperty({ example: 'Principal' })
  @IsString()
  apellidos: string;

  @ApiPropertyOptional({ example: 'admin', enum: ['admin', 'reception', 'limpieza', 'mantenimiento'] })
  @IsOptional()
  @IsEnum(['admin', 'reception', 'limpieza', 'mantenimiento'], { message: 'El rol debe ser admin, reception, limpieza o mantenimiento' })
  role?: 'admin' | 'reception' | 'limpieza' | 'mantenimiento';
}
