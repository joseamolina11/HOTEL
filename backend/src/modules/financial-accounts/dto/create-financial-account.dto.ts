import { IsString, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFinancialAccountDto {
  @ApiProperty({ example: 'Caja Principal' })
  @IsString()
  nombre: string;

  @ApiProperty({ example: 'caja_principal', enum: ['caja_principal', 'caja_menor', 'banco', 'billetera_digital'] })
  @IsString()
  tipo: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  saldoInicial?: number;

  @ApiPropertyOptional({ example: 'Cuenta principal del hotel' })
  @IsOptional()
  @IsString()
  descripcion?: string;
}

export class UpdateFinancialAccountDto {
  @ApiPropertyOptional({ example: 'Caja Principal' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ example: 'caja_principal' })
  @IsOptional()
  @IsString()
  tipo?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  saldoInicial?: number;

  @ApiPropertyOptional({ example: 'Cuenta principal del hotel' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
