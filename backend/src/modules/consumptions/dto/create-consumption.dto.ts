import { IsString, IsNumber, Min, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConsumptionDto {
  @ApiProperty({ example: 'uuid-reservation' })
  @IsString()
  reservationId: string;

  @ApiProperty({ example: 'uuid-inventory-item' })
  @IsString()
  inventoryItemId: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  cantidad: number;

  @ApiPropertyOptional({ example: '2025-06-15T14:30:00Z' })
  @IsOptional()
  @IsDateString()
  fecha?: string;
}

export class ConsumptionFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reservationId?: string;
}
