import { IsString, IsOptional, IsEmail, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGuestDto {
  @ApiProperty({ example: 'Juan Carlos' })
  @IsString()
  nombres: string;

  @ApiProperty({ example: 'Pérez García' })
  @IsString()
  apellidos: string;

  @ApiProperty({ example: 'PAS123456' })
  @IsString()
  documento: string;

  @ApiProperty({ example: 'Mexicana' })
  @IsString()
  nacionalidad: string;

  @ApiProperty({ example: '+52 998 123 4567' })
  @IsString()
  telefono: string;

  @ApiPropertyOptional({ example: 'juan@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '1990-05-15' })
  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @ApiPropertyOptional({ example: 'Cliente frecuente' })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class UpdateGuestDto {
  @ApiPropertyOptional({ example: 'Juan Carlos' })
  @IsOptional()
  @IsString()
  nombres?: string;

  @ApiPropertyOptional({ example: 'Pérez García' })
  @IsOptional()
  @IsString()
  apellidos?: string;

  @ApiPropertyOptional({ example: 'PAS123456' })
  @IsOptional()
  @IsString()
  documento?: string;

  @ApiPropertyOptional({ example: 'Mexicana' })
  @IsOptional()
  @IsString()
  nacionalidad?: string;

  @ApiPropertyOptional({ example: '+52 998 123 4567' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ example: 'juan@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '1990-05-15' })
  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @ApiPropertyOptional({ example: 'Cliente frecuente' })
  @IsOptional()
  @IsString()
  observaciones?: string;
}
