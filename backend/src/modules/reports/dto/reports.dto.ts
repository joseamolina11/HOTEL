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

export class CashRegisterReportQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  hasta?: string;
}

export class ExpensesReportQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  hasta?: string;
}

export class RoomReportQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  hasta?: string;
}

export class CashRegisterByRoomReportQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  hasta?: string;
}
