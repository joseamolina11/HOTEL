import { IsString, IsNumber, IsOptional, IsArray, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class UpdateOrderItemDto {
  @ApiPropertyOptional()
  @IsString()
  inventoryItemId: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(1)
  cantidad: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  precioUnitario: number;
}

export class UpdateOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({ type: [UpdateOrderItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderItemDto)
  items?: UpdateOrderItemDto[];
}
