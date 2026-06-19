import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty({ example: 'Distribuciones ABC S.A.S.' })
  @IsString()
  razonSocial: string;

  @ApiProperty({ example: '901.123.456-7' })
  @IsString()
  nit: string;

  @ApiPropertyOptional({ example: 'Carlos Gómez' })
  @IsOptional()
  @IsString()
  contacto?: string;

  @ApiPropertyOptional({ example: '+57 300 123 4567' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ example: 'carlos@distribucionesabc.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 'Calle 45 #20-30, Bogotá' })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional({ example: 'uuid-file' })
  @IsOptional()
  @IsString()
  rutFileId?: string;
}

export class UpdateSupplierDto {
  @ApiPropertyOptional({ example: 'Distribuciones ABC S.A.S.' })
  @IsOptional()
  @IsString()
  razonSocial?: string;

  @ApiPropertyOptional({ example: '901.123.456-7' })
  @IsOptional()
  @IsString()
  nit?: string;

  @ApiPropertyOptional({ example: 'Carlos Gómez' })
  @IsOptional()
  @IsString()
  contacto?: string;

  @ApiPropertyOptional({ example: '+57 300 123 4567' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ example: 'carlos@distribucionesabc.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 'Calle 45 #20-30, Bogotá' })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional({ example: 'uuid-file' })
  @IsOptional()
  @IsString()
  rutFileId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
