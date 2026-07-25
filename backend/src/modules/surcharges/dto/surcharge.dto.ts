import { IsString, IsNumber, IsOptional, Min, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSurchargeDto {
  @ApiProperty({ example: 'uuid-reservation' })
  @IsString()
  reservationId: string;

  @ApiPropertyOptional({ example: 'uuid-surcharge-type' })
  @IsOptional()
  @IsString()
  surchargeTypeId?: string;

  @ApiProperty({ example: 'Persona extra' })
  @IsString()
  descripcion: string;

  @ApiProperty({ example: 25000 })
  @IsNumber()
  @Min(0)
  monto: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  cantidad?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fecha?: string;
}

export class SurchargeFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reservationId?: string;
}
