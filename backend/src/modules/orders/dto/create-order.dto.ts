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
  @ApiProperty({ example: 'uuid-room' })
  @IsString()
  roomId: string;

  @ApiPropertyOptional({ example: 'uuid-reservation' })
  @IsOptional()
  @IsString()
  reservationId?: string;

  @ApiPropertyOptional({ example: 'uuid-guest' })
  @IsOptional()
  @IsString()
  guestId?: string;

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
}
