import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFinancialMovementDto {
  @ApiProperty({ example: 'uuid-account' })
  @IsString()
  accountId: string;

  @ApiProperty({ example: 'INGRESO', enum: ['INGRESO', 'EGRESO', 'TRANSFERENCIA_ENTRADA', 'TRANSFERENCIA_SALIDA', 'AJUSTE', 'APERTURA_CAJA', 'CIERRE_CAJA'] })
  @IsString()
  tipo: string;

  @ApiProperty({ example: 100.00 })
  @IsNumber()
  monto: number;

  @ApiProperty({ example: 'Pago de reserva #001' })
  @IsString()
  concepto: string;

  @ApiPropertyOptional({ example: 'payment' })
  @IsOptional()
  @IsString()
  referenciaTipo?: string;

  @ApiPropertyOptional({ example: 'uuid-payment' })
  @IsOptional()
  @IsString()
  referenciaId?: string;

  @ApiPropertyOptional({ example: 'uuid-recibo-caja' })
  @IsOptional()
  @IsString()
  reciboId?: string;
}

export class TransferDto {
  @IsString()
  originAccountId: string;

  @ApiProperty({ example: 'uuid-destination-account' })
  @IsString()
  destinationAccountId: string;

  @ApiProperty({ example: 500.00 })
  @IsNumber()
  monto: number;

  @ApiPropertyOptional({ example: 'Transferencia a caja menor' })
  @IsOptional()
  @IsString()
  concepto?: string;
}
