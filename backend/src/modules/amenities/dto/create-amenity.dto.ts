import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAmenityDto {
  @ApiProperty({ example: 'WiFi' })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ example: 'Internet de alta velocidad' })
  @IsOptional()
  @IsString()
  descripcion?: string;
}

export class UpdateAmenityDto {
  @ApiPropertyOptional({ example: 'WiFi' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ example: 'Internet de alta velocidad' })
  @IsOptional()
  @IsString()
  descripcion?: string;
}
