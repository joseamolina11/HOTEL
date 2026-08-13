import { IsString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChangeMetodoPagoDto {
  @ApiProperty({ example: 'uuid-payment-method' })
  @IsUUID()
  metodoPagoId: string;
}

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

  @ApiProperty({ example: 'uuid-payment-method' })
  @IsUUID()
  metodoPagoId: string;

  @ApiPropertyOptional({ example: 'Recibo #001' })
  @IsOptional()
  @IsString()
  comprobante?: string;

  @ApiPropertyOptional({ example: 'Pago en efectivo' })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class UpdatePaymentDto {
  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monto?: number;

  @ApiPropertyOptional({ example: 'uuid-payment-method', nullable: true })
  @IsOptional()
  @IsString()
  metodoPagoId?: string | null;

  @ApiPropertyOptional({ example: 'uuid-reservation', nullable: true })
  @IsOptional()
  @IsString()
  reservationId?: string | null;

  @ApiPropertyOptional({ example: 'Recibo #001' })
  @IsOptional()
  @IsString()
  comprobante?: string;

  @ApiPropertyOptional({ example: 'Pago en efectivo' })
  @IsOptional()
  @IsString()
  observaciones?: string;
}
