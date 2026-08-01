import { IsOptional, IsDateString, IsString, IsIn, MaxLength } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class CalendarQueryDto {
  @ApiProperty({ description: 'Fecha inicial (YYYY-MM-DD)' })
  @IsDateString()
  inicio: string;

  @ApiProperty({ description: 'Fecha final (YYYY-MM-DD)' })
  @IsDateString()
  fin: string;
}

export class EventQueryDto {
  @ApiPropertyOptional({ description: 'Desde (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ description: 'Hasta (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  hasta?: string;
}

export class CreateCalendarEventDto {
  @ApiProperty({ description: 'Título del evento' })
  @IsString()
  @MaxLength(200)
  titulo: string;

  @ApiPropertyOptional({ description: 'Descripción' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ description: 'Fecha del evento (YYYY-MM-DD)' })
  @IsDateString()
  fecha: string;

  @ApiPropertyOptional({ description: 'Hora inicio (HH:mm)' })
  @IsOptional()
  @IsString()
  horaInicio?: string;

  @ApiPropertyOptional({ description: 'Hora fin (HH:mm)' })
  @IsOptional()
  @IsString()
  horaFin?: string;

  @ApiPropertyOptional({ description: 'Tipo', enum: ['evento', 'mantenimiento', 'feriado', 'otro'] })
  @IsOptional()
  @IsIn(['evento', 'mantenimiento', 'feriado', 'otro'])
  tipo?: 'evento' | 'mantenimiento' | 'feriado' | 'otro';

  @ApiPropertyOptional({ description: 'Color hex' })
  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdateCalendarEventDto extends CreateCalendarEventDto {}
