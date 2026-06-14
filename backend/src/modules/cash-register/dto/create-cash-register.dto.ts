import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OpenCashRegisterDto {
  @ApiProperty({ example: 500.00 })
  @IsNumber()
  @Min(0)
  montoInicial: number;

  @ApiPropertyOptional({ example: 'Apertura turno mañana' })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class CloseCashRegisterDto {
  @ApiProperty({ example: 1500.00 })
  @IsNumber()
  @Min(0)
  totalEfectivo: number;

  @ApiProperty({ example: 800.00 })
  @IsNumber()
  @Min(0)
  totalTransferencia: number;

  @ApiProperty({ example: 500.00 })
  @IsNumber()
  @Min(0)
  totalTarjeta: number;

  @ApiProperty({ example: 200.00 })
  @IsNumber()
  @Min(0)
  totalOtros: number;

  @ApiProperty({ example: 45 })
  @IsNumber()
  @Min(0)
  cantidadTransacciones: number;

  @ApiPropertyOptional({ example: 50.00 })
  @IsOptional()
  @IsNumber()
  diferencia?: number;

  @ApiPropertyOptional({ example: 'Diferencia por redondeo' })
  @IsOptional()
  @IsString()
  observaciones?: string;
}
