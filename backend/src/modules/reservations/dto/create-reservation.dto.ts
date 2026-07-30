import { IsString, IsDateString, IsNumber, IsOptional, IsEnum, Min, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CompanionDto {
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

export class CreateReservationDto {
  @ApiProperty({ example: 'uuid-room' })
  @IsString()
  roomId: string;

  @ApiProperty({ example: 'uuid-guest' })
  @IsString()
  guestId: string;

  @ApiProperty({ example: '2025-06-15T15:00:00Z' })
  @IsDateString()
  fechaEntrada: string;

  @ApiProperty({ example: '2025-06-18T12:00:00Z' })
  @IsDateString()
  fechaSalida: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  cantidadHuespedes: number;

  @ApiPropertyOptional({ example: 'Solicita cuna para bebé' })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({ example: 'confirmada', enum: ['pendiente', 'confirmada'] })
  @IsOptional()
  @IsEnum(['pendiente', 'confirmada'])
  estado?: 'pendiente' | 'confirmada';

  @ApiPropertyOptional({ type: [CompanionDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CompanionDto)
  companions?: CompanionDto[];

  @ApiPropertyOptional({ example: 150000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pagoMonto?: number;

  @ApiPropertyOptional({ example: 'uuid-payment-method' })
  @IsOptional()
  @IsString()
  pagoMetodoPagoId?: string;

  @ApiPropertyOptional({ example: 'Anticipo reserva' })
  @IsOptional()
  @IsString()
  pagoReferencia?: string;

  @ApiPropertyOptional({ example: 25000, description: 'Descuento sobre el total' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  descuento?: number;
}

export class UpdateReservationDto {
  @ApiPropertyOptional({ example: 'uuid-room' })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiPropertyOptional({ example: '2025-06-15T15:00:00Z' })
  @IsOptional()
  @IsDateString()
  fechaEntrada?: string;

  @ApiPropertyOptional({ example: '2025-06-18T12:00:00Z' })
  @IsOptional()
  @IsDateString()
  fechaSalida?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  cantidadHuespedes?: number;

  @ApiPropertyOptional({ example: 'Solicita cuna para bebé' })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contratoFileId?: string;

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
}

export class CancelReservationDto {
  @ApiPropertyOptional({ example: 'Cancelación por solicitud del huésped' })
  @IsOptional()
  @IsString()
  motivo?: string;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reembolsoMonto?: number;

  @ApiPropertyOptional({ example: 'uuid-metodo-pago' })
  @IsOptional()
  @IsString()
  reembolsoMetodoPagoId?: string;
}

export class ChangeRoomDto {
  @ApiProperty({ example: 'uuid-new-room' })
  @IsString()
  newRoomId: string;
}

export class ReservationFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fechaEntrada?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fechaSalida?: string;

  @ApiPropertyOptional({ enum: ['pendiente', 'confirmada', 'checkin', 'checkout', 'cancelada'] })
  @IsOptional()
  @IsString()
  estado?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Página (1-based)', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Items por página', default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}
