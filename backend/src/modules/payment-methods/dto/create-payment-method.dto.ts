import { IsString, IsOptional, IsBoolean, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentMethodDto {
  @ApiProperty({ example: 'Efectivo' })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ example: 'Pago en efectivo' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ example: 'uuid-financial-account' })
  @IsOptional()
  @IsUUID()
  financialAccountId?: string;

  @ApiPropertyOptional({ example: 'efectivo', enum: ['efectivo', 'transferencia', 'tarjeta', 'otros'] })
  @IsOptional()
  @IsEnum(['efectivo', 'transferencia', 'tarjeta', 'otros'])
  tipo?: 'efectivo' | 'transferencia' | 'tarjeta' | 'otros';
}

export class UpdatePaymentMethodDto {
  @ApiPropertyOptional({ example: 'Efectivo' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ example: 'Pago en efectivo' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ example: 'uuid-financial-account' })
  @IsOptional()
  @IsUUID()
  financialAccountId?: string;

  @ApiPropertyOptional({ example: 'efectivo', enum: ['efectivo', 'transferencia', 'tarjeta', 'otros'] })
  @IsOptional()
  @IsEnum(['efectivo', 'transferencia', 'tarjeta', 'otros'])
  tipo?: 'efectivo' | 'transferencia' | 'tarjeta' | 'otros';

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
