import { IsString, IsOptional, IsNumber, IsDateString, IsUUID, Min, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReciboCajaPagoDto {
  @ApiProperty({ example: 'Hospedaje' })
  @IsString()
  concepto: string;

  @ApiProperty({ example: 250000 })
  @IsNumber()
  @Min(1)
  monto: number;

  @ApiProperty({ example: 'uuid-payment-method' })
  @IsUUID()
  metodoPagoId: string;

  @ApiProperty({ example: 'uuid-financial-account' })
  @IsUUID()
  cuentaId: string;

  @ApiPropertyOptional({ example: 'reservation' })
  @IsOptional()
  @IsString()
  referenciaTipo?: string;

  @ApiPropertyOptional({ example: 'uuid-reservation' })
  @IsOptional()
  @IsString()
  referenciaId?: string;
}

export class ReciboCajaItemDto {
  @ApiProperty({ example: 'Habitación 101 x 3 noches' })
  @IsString()
  concepto: string;

  @ApiProperty({ example: 3 })
  @IsNumber()
  @Min(0)
  cantidad: number;

  @ApiProperty({ example: 100000 })
  @IsNumber()
  @Min(0)
  precioUnitario: number;

  @ApiProperty({ example: 300000 })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiPropertyOptional({ example: 'habitacion', enum: ['habitacion', 'consumo', 'pedido', 'otro'] })
  @IsOptional()
  @IsString()
  @IsIn(['habitacion', 'consumo', 'pedido', 'otro'])
  tipo?: string;
}

export class CreateReciboCajaDto {
  @ApiPropertyOptional({ example: 'Juan Pérez' })
  @IsOptional()
  @IsString()
  clienteNombre?: string;

  @ApiPropertyOptional({ example: 'uuid-reservation' })
  @IsOptional()
  @IsString()
  reservationId?: string;

  @ApiProperty({ example: '2025-06-19' })
  @IsDateString()
  fecha: string;

  @ApiProperty({ example: 300000 })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  descuento?: number;

  @ApiProperty({ example: 250000 })
  @IsNumber()
  @Min(0)
  total: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiProperty({ type: [ReciboCajaPagoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReciboCajaPagoDto)
  pagos: ReciboCajaPagoDto[];

  @ApiPropertyOptional({ type: [ReciboCajaItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReciboCajaItemDto)
  items?: ReciboCajaItemDto[];
}

export class UpdateReciboCajaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clienteNombre?: string;

  @ApiPropertyOptional({ example: '2025-06-19' })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;
}
