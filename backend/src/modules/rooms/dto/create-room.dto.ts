import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ example: '101' })
  @IsString()
  numero: string;

  @ApiProperty({ example: 'Habitación 101 - Vista al mar' })
  @IsString()
  nombre: string;

  @ApiProperty({ example: 'uuid-room-type' })
  @IsString()
  roomTypeId: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  piso?: number;

  @ApiPropertyOptional({ example: 'Cerca del elevador' })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({ example: 'disponible', enum: ['disponible', 'reservada', 'ocupada', 'limpieza', 'mantenimiento'] })
  @IsOptional()
  @IsEnum(['disponible', 'reservada', 'ocupada', 'limpieza', 'mantenimiento'])
  estado?: 'disponible' | 'reservada' | 'ocupada' | 'limpieza' | 'mantenimiento';
}

export class UpdateRoomDto {
  @ApiPropertyOptional({ example: '101' })
  @IsOptional()
  @IsString()
  numero?: string;

  @ApiPropertyOptional({ example: 'Habitación 101 - Vista al mar' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ example: 'uuid-room-type' })
  @IsOptional()
  @IsString()
  roomTypeId?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  piso?: number;

  @ApiPropertyOptional({ example: 'Cerca del elevador' })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class ChangeRoomStatusDto {
  @ApiProperty({ example: 'mantenimiento', enum: ['disponible', 'reservada', 'ocupada', 'limpieza', 'mantenimiento'] })
  @IsEnum(['disponible', 'reservada', 'ocupada', 'limpieza', 'mantenimiento'])
  estado: 'disponible' | 'reservada' | 'ocupada' | 'limpieza' | 'mantenimiento';
}
