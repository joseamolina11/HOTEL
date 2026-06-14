import { IsString, IsOptional, IsNumber, IsEnum, IsArray, Min, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentSplitDto {
  @ApiProperty({ example: 150.00 })
  @IsNumber()
  @Min(0.01)
  monto: number;

  @ApiProperty({ example: 'efectivo', enum: ['efectivo', 'transferencia', 'tarjeta', 'otros'] })
  @IsEnum(['efectivo', 'transferencia', 'tarjeta', 'otros'])
  metodoPago: 'efectivo' | 'transferencia' | 'tarjeta' | 'otros';

  @ApiPropertyOptional({ example: 'Recibo #001' })
  @IsOptional()
  @IsString()
  comprobante?: string;
}

export class CheckOutDto {
  @ApiProperty({ example: 'uuid-reservation' })
  @IsString()
  reservationId: string;

  @ApiPropertyOptional({ example: 'Salida voluntaria' })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({ type: [PaymentSplitDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentSplitDto)
  payments?: PaymentSplitDto[];
}
