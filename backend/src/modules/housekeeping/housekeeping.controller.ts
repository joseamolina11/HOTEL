import { Controller, Get, Put, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiProperty } from '@nestjs/swagger';
import { HousekeepingService } from './housekeeping.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ROLES } from 'src/common/constants';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/auth.interface';
import { IsArray } from 'class-validator';

class ChangeRoomStatusDto {
  @ApiProperty({ example: 'disponible' })
  estado: 'disponible' | 'ocupada' | 'reservada' | 'limpieza' | 'mantenimiento';
}

class AssignSuppliesDto {
  @ApiProperty({ example: [{ supplyItemId: 'uuid-del-insumo', cantidad: 5 }] })
  @IsArray()
  items: { supplyItemId: string; cantidad: number }[];
}

@ApiTags('Housekeeping')
@Controller('housekeeping')
export class HousekeepingController {
  constructor(private readonly housekeepingService: HousekeepingService) {}

  @Get()
  @Roles(ROLES.ADMIN, ROLES.RECEPTION, ROLES.LIMPIEZA, ROLES.MANTENIMIENTO)
  @ApiOperation({ summary: 'Listar habitaciones en limpieza/mantenimiento' })
  @ApiQuery({ name: 'tipo', required: false, enum: ['limpieza', 'mantenimiento', 'all'] })
  async findAll(@Query('tipo') tipo?: 'limpieza' | 'mantenimiento' | 'all') {
    return this.housekeepingService.findAll(tipo);
  }

  @Put(':roomId/status')
  @Roles(ROLES.ADMIN, ROLES.LIMPIEZA, ROLES.MANTENIMIENTO)
  @ApiOperation({ summary: 'Cambiar estado de habitación desde limpieza/mantenimiento' })
  async changeStatus(
    @Param('roomId') roomId: string,
    @Body() dto: ChangeRoomStatusDto,
  ) {
    return this.housekeepingService.changeStatus(roomId, dto.estado);
  }

  @Post(':roomId/supplies')
  @Roles(ROLES.ADMIN, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Asignar insumos necesarios para limpieza de habitación' })
  async assignSupplies(
    @Param('roomId') roomId: string,
    @Body() dto: AssignSuppliesDto,
  ) {
    return this.housekeepingService.assignSupplies(roomId, dto.items);
  }

  @Get(':roomId/supplies')
  @Roles(ROLES.ADMIN, ROLES.LIMPIEZA, ROLES.RECEPTION)
  @ApiOperation({ summary: 'Obtener insumos asignados a una habitación' })
  async getAssignedSupplies(@Param('roomId') roomId: string) {
    return this.housekeepingService.getAssignedSupplies(roomId);
  }

  @Post(':roomId/complete')
  @Roles(ROLES.ADMIN, ROLES.LIMPIEZA)
  @ApiOperation({ summary: 'Completar limpieza: descuenta insumos y marca disponible' })
  async completeCleaning(
    @Param('roomId') roomId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.housekeepingService.completeCleaning(roomId, user.sub);
  }
}
