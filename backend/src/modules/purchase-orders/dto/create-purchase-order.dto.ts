import { IsString, IsOptional, IsNumber, IsArray, Min, ValidateNested, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PurchaseOrderItemDto {
  @ApiPropertyOptional({ example: 'uuid-inventory-item' })
  @IsOptional()
  @IsString()
  inventoryItemId?: string;

  @ApiPropertyOptional({ example: 'uuid-service' })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiProperty({ example: 'Papel higiénico x 50 rollos' })
  @IsString()
  descripcion: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(1)
  cantidad: number;

  @ApiProperty({ example: 25.50 })
  @IsNumber()
  @Min(0)
  precioUnitario: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ example: 'uuid-supplier' })
  @IsString()
  supplierId: string;

  @ApiProperty({ example: '2025-06-18' })
  @IsDateString()
  fecha: string;

  @ApiPropertyOptional({ example: 'Pedido urgente' })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({ example: 'borrador', enum: ['borrador', 'aprobada'] })
  @IsOptional()
  @IsEnum(['borrador', 'aprobada'])
  estado?: 'borrador' | 'aprobada';

  @ApiPropertyOptional({ example: 'uuid-tax-config' })
  @IsOptional()
  @IsString()
  taxConfigId?: string;

  @ApiProperty({ type: [PurchaseOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];
}

export class UpdatePurchaseOrderDto {
  @ApiPropertyOptional({ example: 'uuid-supplier' })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiPropertyOptional({ example: '2025-06-18' })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiPropertyOptional({ example: 'Pedido urgente' })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({ example: 'aprobada', enum: ['borrador', 'aprobada', 'recibida', 'anulada'] })
  @IsOptional()
  @IsEnum(['borrador', 'aprobada', 'recibida', 'anulada'])
  estado?: 'borrador' | 'aprobada' | 'recibida' | 'anulada';

  @ApiPropertyOptional({ example: 'uuid-tax-config' })
  @IsOptional()
  @IsString()
  taxConfigId?: string;

  @ApiPropertyOptional({ type: [PurchaseOrderItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items?: PurchaseOrderItemDto[];
}

export class UpdateOrderStatusDto {
  @ApiProperty({ example: 'aprobada', enum: ['borrador', 'aprobada', 'recibida', 'anulada'] })
  @IsEnum(['borrador', 'aprobada', 'recibida', 'anulada'])
  estado: 'borrador' | 'aprobada' | 'recibida' | 'anulada';
}
