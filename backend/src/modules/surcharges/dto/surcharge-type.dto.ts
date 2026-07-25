import { IsString, IsNumber, IsOptional, Min, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSurchargeTypeDto {
  @ApiProperty({ example: 'Persona extra' })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ example: 'Cargo por huésped adicional' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ example: 25000 })
  @IsNumber()
  @Min(0)
  montoDefault: number;

  @ApiPropertyOptional({ enum: ['fijo', 'por_noche', 'porcentaje'], default: 'fijo' })
  @IsOptional()
  @IsEnum(['fijo', 'por_noche', 'porcentaje'])
  tipo?: 'fijo' | 'por_noche' | 'porcentaje';

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdateSurchargeTypeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  montoDefault?: number;

  @ApiPropertyOptional({ enum: ['fijo', 'por_noche', 'porcentaje'] })
  @IsOptional()
  @IsEnum(['fijo', 'por_noche', 'porcentaje'])
  tipo?: 'fijo' | 'por_noche' | 'porcentaje';

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
