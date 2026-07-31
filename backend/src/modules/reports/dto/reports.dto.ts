import { IsOptional, IsString, IsDateString, IsArray, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SurchargeReportQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  hasta?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dispersado?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  terceroId?: string;
}

export class DisperseSurchargesDto {
  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  ids: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  disperse?: boolean;
}
