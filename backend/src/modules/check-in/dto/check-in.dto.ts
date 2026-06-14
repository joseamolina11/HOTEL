import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
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
}
