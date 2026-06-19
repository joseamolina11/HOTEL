import { IsString, IsOptional, IsEmail, IsDate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHotelConfigDto {
  @ApiProperty({ example: 'Hotel Paraíso' })
  @IsString()
  nombre: string;

  @ApiProperty({ example: 'Av. Principal 123' })
  @IsString()
  direccion: string;

  @ApiProperty({ example: 'Cancún' })
  @IsString()
  ciudad: string;

  @ApiProperty({ example: 'México' })
  @IsString()
  pais: string;

  @ApiProperty({ example: '+52 998 123 4567' })
  @IsString()
  telefono: string;

  @ApiProperty({ example: 'info@hotelparaiso.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'https://hotel.com/logo.png' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ example: 'MXN' })
  @IsOptional()
  @IsString()
  moneda?: string;

  @ApiPropertyOptional({ example: '15:00' })
  @IsOptional()
  @IsString()
  checkInTime?: string;

  @ApiPropertyOptional({ example: '12:00' })
  @IsOptional()
  @IsString()
  checkOutTime?: string;

  @ApiPropertyOptional({ example: '<h1>Contrato de Hospedaje</h1>...' })
  @IsOptional()
  @IsString()
  contratoHtml?: string;
}

export class UpdateHotelConfigDto {

  @ApiPropertyOptional({ example: 'Hotel Paraíso' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ example: 'Hotel Paraíso' })
  @IsOptional()
  @IsDate()
  createdAt?: Date;
  @ApiPropertyOptional({ example: 'Hotel Paraíso' })
  @IsOptional()
  @IsDate()
  updatedAt?: Date;

  @ApiPropertyOptional({ example: 'Hotel Paraíso' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ example: 'Av. Principal 123' })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional({ example: 'Cancún' })
  @IsOptional()
  @IsString()
  ciudad?: string;

  @ApiPropertyOptional({ example: 'México' })
  @IsOptional()
  @IsString()
  pais?: string;

  @ApiPropertyOptional({ example: '+52 998 123 4567' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ example: 'info@hotelparaiso.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'https://hotel.com/logo.png' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ example: 'MXN' })
  @IsOptional()
  @IsString()
  moneda?: string;

  @ApiPropertyOptional({ example: '15:00' })
  @IsOptional()
  @IsString()
  checkInTime?: string;

  @ApiPropertyOptional({ example: '12:00' })
  @IsOptional()
  @IsString()
  checkOutTime?: string;

  @ApiPropertyOptional({ example: '<h1>Contrato de Hospedaje</h1>...' })
  @IsOptional()
  @IsString()
  contratoHtml?: string;
}
