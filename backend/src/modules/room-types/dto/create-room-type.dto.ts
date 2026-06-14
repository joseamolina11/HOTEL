import { IsString, IsNumber, IsOptional, IsBoolean, Min, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomTypeDto {
  @ApiProperty({ example: 'Suite Premium' })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ example: 'Habitación de lujo con vista al mar' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  capacidadAdultos: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacidadNinos?: number;

  @ApiProperty({ example: 2500 })
  @IsNumber()
  @Min(0)
  precioBase: number;

  @ApiPropertyOptional({ example: '#8B5CF6' })
  @IsOptional()
  @IsString()
  colorIdentificador?: string;

  @ApiPropertyOptional({ example: ['amenity-uuid-1', 'amenity-uuid-2'] })
  @IsOptional()
  @IsArray()
  amenityIds?: string[];
}

export class UpdateRoomTypeDto {
  @ApiPropertyOptional({ example: 'Suite Premium' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ example: 'Habitación de lujo con vista al mar' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  capacidadAdultos?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacidadNinos?: number;

  @ApiPropertyOptional({ example: 2500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  precioBase?: number;

  @ApiPropertyOptional({ example: '#8B5CF6' })
  @IsOptional()
  @IsString()
  colorIdentificador?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  amenityIds?: string[];
}
