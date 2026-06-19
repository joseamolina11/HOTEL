import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaxConfigDto {
  @ApiProperty({ example: 'IVA 19%' })
  @IsString()
  nombre: string;

  @ApiProperty({ example: 19 })
  @IsNumber()
  @Min(0)
  @Max(100)
  tasa: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  esDefecto?: boolean;
}

export class UpdateTaxConfigDto {
  @ApiPropertyOptional({ example: 'IVA 19%' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ example: 19 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tasa?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  esDefecto?: boolean;
}
