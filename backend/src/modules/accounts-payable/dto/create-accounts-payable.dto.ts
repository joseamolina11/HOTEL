import { IsString, IsOptional, IsNumber, IsEnum, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAccountsPayableDto {
  @ApiProperty({ example: 'uuid-supplier' })
  @IsString()
  supplierId: string;

  @ApiPropertyOptional({ example: 'uuid-purchase-order' })
  @IsOptional()
  @IsString()
  purchaseOrderId?: string;

  @ApiPropertyOptional({ example: 'uuid-expense' })
  @IsOptional()
  @IsString()
  expenseId?: string;

  @ApiProperty({ example: '2025-06-18' })
  @IsDateString()
  fechaEmision: string;

  @ApiProperty({ example: '2025-07-18' })
  @IsDateString()
  fechaVencimiento: string;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  @Min(1)
  montoOriginal: number;

  @ApiProperty({ example: 'pendiente', enum: ['pendiente', 'parcialmente_pagada', 'pagada', 'vencida', 'anulada'] })
  @IsOptional()
  @IsEnum(['pendiente', 'parcialmente_pagada', 'pagada', 'vencida', 'anulada'])
  estado?: 'pendiente' | 'parcialmente_pagada' | 'pagada' | 'vencida' | 'anulada';

  @ApiPropertyOptional({ example: 'Factura proveedor junio 2025' })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class UpdateAccountsPayableDto {
  @ApiPropertyOptional({ example: 'uuid-supplier' })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiPropertyOptional({ example: 'uuid-purchase-order' })
  @IsOptional()
  @IsString()
  purchaseOrderId?: string;

  @ApiPropertyOptional({ example: 'uuid-expense' })
  @IsOptional()
  @IsString()
  expenseId?: string;

  @ApiPropertyOptional({ example: '2025-06-18' })
  @IsOptional()
  @IsDateString()
  fechaEmision?: string;

  @ApiPropertyOptional({ example: '2025-07-18' })
  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  montoOriginal?: number;

  @ApiPropertyOptional({ example: 'pendiente', enum: ['pendiente', 'parcialmente_pagada', 'pagada', 'vencida', 'anulada'] })
  @IsOptional()
  @IsEnum(['pendiente', 'parcialmente_pagada', 'pagada', 'vencida', 'anulada'])
  estado?: 'pendiente' | 'parcialmente_pagada' | 'pagada' | 'vencida' | 'anulada';

  @ApiPropertyOptional({ example: 'Factura proveedor junio 2025' })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class RegisterPagoDto {
  @ApiProperty({ example: 100000 })
  @IsNumber()
  @Min(1)
  monto: number;

  @ApiProperty({ example: '2025-06-20' })
  @IsDateString()
  fechaPago: string;

  @ApiProperty({ example: 'transferencia', enum: ['efectivo', 'transferencia', 'tarjeta', 'otros'] })
  @IsEnum(['efectivo', 'transferencia', 'tarjeta', 'otros'])
  metodoPago: 'efectivo' | 'transferencia' | 'tarjeta' | 'otros';

  @ApiPropertyOptional({ example: 'REF-PAGO-001' })
  @IsOptional()
  @IsString()
  referencia?: string;
}
