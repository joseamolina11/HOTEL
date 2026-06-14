import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiPropertyOptional({ example: 'uuid-order' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({ example: 'uuid-reservation' })
  @IsOptional()
  @IsString()
  reservationId?: string;

  @ApiProperty({ example: 'uuid-room' })
  @IsString()
  roomId: string;

  @ApiProperty({ example: 25.00 })
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

  @ApiPropertyOptional({ example: 'Pago en efectivo' })
  @IsOptional()
  @IsString()
  observaciones?: string;
}
