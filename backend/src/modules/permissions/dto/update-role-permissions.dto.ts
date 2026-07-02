import { IsString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRolePermissionsDto {
  @ApiProperty({ example: 'reception' })
  @IsString()
  role: string;

  @ApiProperty({ example: ['perm-id-1', 'perm-id-2'] })
  @IsArray()
  permissionIds: string[];
}
