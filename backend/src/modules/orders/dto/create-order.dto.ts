import { IsString, IsNumber, IsOptional, IsArray, Min, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({ example: 'uuid-product' })
  @IsString()
  inventoryItemId: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  cantidad: number;

  @ApiProperty({ example: 5.50 })
  @IsNumber()
  @Min(0)
  precioUnitario: number;
}

export class CreateOrderDto {
  @ApiPropertyOptional({ example: 'uuid-room' })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiPropertyOptional({ example: 'uuid-reservation' })
  @IsOptional()
  @IsString()
  reservationId?: string;

  @ApiPropertyOptional({ example: 'uuid-guest' })
  @IsOptional()
  @IsString()
  guestId?: string;

  @ApiPropertyOptional({ example: 'Cliente venta directa' })
  @IsOptional()
  @IsString()
  clienteNombre?: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional({ example: 'Pedido urgente' })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({ example: 'uuid-payment-method' })
  @IsOptional()
  @IsString()
  pagoMetodoPagoId?: string;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pagoMonto?: number;

  @ApiPropertyOptional({ example: 'Referencia pago' })
  @IsOptional()
  @IsString()
  pagoReferencia?: string;

  @ApiPropertyOptional({ example: true, description: 'Si es venta directa (sin habitación)' })
  @IsOptional()
  ventaDirecta?: boolean;
}
