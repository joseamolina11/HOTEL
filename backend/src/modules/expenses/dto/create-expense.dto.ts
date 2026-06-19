import { IsString, IsOptional, IsNumber, IsEnum, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExpenseDto {
  @ApiPropertyOptional({ example: 'uuid-supplier' })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiProperty({ example: 'uuid-category' })
  @IsString()
  categoryId: string;

  @ApiProperty({ example: '2025-06-18' })
  @IsDateString()
  fecha: string;

  @ApiProperty({ example: 'Pago factura de energía eléctrica' })
  @IsString()
  concepto: string;

  @ApiProperty({ example: 'transferencia', enum: ['efectivo', 'transferencia', 'tarjeta', 'otros'] })
  @IsEnum(['efectivo', 'transferencia', 'tarjeta', 'otros'])
  metodoPago: 'efectivo' | 'transferencia' | 'tarjeta' | 'otros';

  @ApiPropertyOptional({ example: 'REF-2025-001' })
  @IsOptional()
  @IsString()
  referencia?: string;

  @ApiProperty({ example: 250000 })
  @IsNumber()
  @Min(1)
  monto: number;

  @ApiPropertyOptional({ example: 'Factura junio 2025' })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({ example: 'uuid-comprobante' })
  @IsOptional()
  @IsString()
  comprobante?: string;

  @ApiPropertyOptional({ example: 'uuid-purchase-order' })
  @IsOptional()
  @IsString()
  purchaseOrderId?: string;
}

export class UpdateExpenseDto {
  @ApiPropertyOptional({ example: 'uuid-supplier' })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiPropertyOptional({ example: 'uuid-category' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: '2025-06-18' })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiPropertyOptional({ example: 'Pago factura de energía eléctrica' })
  @IsOptional()
  @IsString()
  concepto?: string;

  @ApiPropertyOptional({ example: 'transferencia', enum: ['efectivo', 'transferencia', 'tarjeta', 'otros'] })
  @IsOptional()
  @IsEnum(['efectivo', 'transferencia', 'tarjeta', 'otros'])
  metodoPago?: 'efectivo' | 'transferencia' | 'tarjeta' | 'otros';

  @ApiPropertyOptional({ example: 'REF-2025-001' })
  @IsOptional()
  @IsString()
  referencia?: string;

  @ApiPropertyOptional({ example: 250000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  monto?: number;

  @ApiPropertyOptional({ example: 'Factura junio 2025' })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({ example: 'uuid-comprobante' })
  @IsOptional()
  @IsString()
  comprobante?: string;

  @ApiPropertyOptional({ example: 'uuid-purchase-order' })
  @IsOptional()
  @IsString()
  purchaseOrderId?: string;
}
