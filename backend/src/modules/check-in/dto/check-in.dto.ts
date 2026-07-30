import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CompanionRegisterDto {
  @ApiProperty({ example: 'María' })
  @IsString()
  nombres: string;

  @ApiProperty({ example: 'López' })
  @IsString()
  apellidos: string;

  @ApiProperty({ example: 'PAS789012' })
  @IsString()
  documento: string;

  @ApiProperty({ example: 'Mexicana' })
  @IsString()
  nacionalidad: string;

  @ApiPropertyOptional({ example: '+584141234567' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ example: 'maria@email.com' })
  @IsOptional()
  @IsString()
  email?: string;
}

class CheckInPaymentDto {
  @ApiProperty({ example: 150.00 })
  @IsNumber()
  @Min(0.01)
  monto: number;

  @ApiProperty({ example: 'uuid-payment-method' })
  @IsUUID()
  metodoPagoId: string;

  @ApiPropertyOptional({ example: 'Efectivo' })
  @IsOptional()
  @IsString()
  concepto?: string;

  @ApiPropertyOptional({ example: 'REF001' })
  @IsOptional()
  @IsString()
  comprobante?: string;
}

export class CheckInDto {
  @ApiProperty({ example: 'uuid-reservation' })
  @IsString()
  reservationId: string;

  @ApiPropertyOptional({ example: 'Llegada puntual' })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({ type: [CompanionRegisterDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompanionRegisterDto)
  companions?: CompanionRegisterDto[];

  @ApiPropertyOptional({ type: [CheckInPaymentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckInPaymentDto)
  pagos?: CheckInPaymentDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ciudad?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pais?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  oficio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  empresa?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telefonoContacto?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emailContacto?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transporteLlegada?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transporteSalida?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reservacionOrigen?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  procedencia?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  destino?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motivoViaje?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  numeroPlaca?: string;

  @ApiPropertyOptional({ example: 0, description: 'Descuento a aplicar sobre el total' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  descuento?: number;

  @ApiPropertyOptional({ example: 150.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pagoMonto?: number;

  @ApiPropertyOptional({ example: 'uuid-payment-method' })
  @IsOptional()
  @IsString()
  pagoMetodoPagoId?: string;

  @ApiPropertyOptional({ example: 'REF001' })
  @IsOptional()
  @IsString()
  pagoReferencia?: string;
}
