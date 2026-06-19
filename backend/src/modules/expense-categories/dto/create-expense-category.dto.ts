import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExpenseCategoryDto {
  @ApiProperty({ example: 'Servicios Públicos' })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ example: 'Agua, luz, internet' })
  @IsOptional()
  @IsString()
  descripcion?: string;
}

export class UpdateExpenseCategoryDto {
  @ApiPropertyOptional({ example: 'Servicios Públicos' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ example: 'Agua, luz, internet' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
