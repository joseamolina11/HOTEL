import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SyncAvailabilityDto {
  @ApiProperty({ example: 'uuid-room' })
  @IsString()
  roomId: string;

  @ApiProperty({ example: '2025-06-15' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-06-20' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: false })
  @IsOptional()
  available?: boolean;
}

export class ImportReservationsDto {
  @ApiProperty({ example: 'booking', enum: ['booking', 'airbnb'] })
  @IsEnum(['booking', 'airbnb'])
  source: 'booking' | 'airbnb';

  @ApiPropertyOptional({ example: '2025-06-01' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;
}

export class OtaConfigDto {
  @ApiPropertyOptional({ example: 'your-api-key' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ example: 'your-api-secret' })
  @IsOptional()
  @IsString()
  apiSecret?: string;

  @ApiPropertyOptional({ example: 'your-client-id' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ example: 'your-client-secret' })
  @IsOptional()
  @IsString()
  clientSecret?: string;
}
