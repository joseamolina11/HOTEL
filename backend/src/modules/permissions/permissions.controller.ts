import { Controller, Get, Post, Put, Delete, Body, Param, ConflictException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';

@ApiTags('Permissions')
@Controller('permissions')

export class PermissionsController {
  constructor(private readonly service: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los permisos disponibles' })
  async findAll() {
    return this.service.findAllPermissions();
  }

  @Get('modules')
  @ApiOperation({ summary: 'Listar módulos disponibles' })
  async getModules() {
    return this.service.getAllModules();
  }

  @Get('roles')
  @ApiOperation({ summary: 'Listar roles disponibles' })
  async getRoles() {
    return this.service.getRoles();
  }

  @Post('roles')
  @ApiOperation({ summary: 'Crear un nuevo rol' })
  async createRole(@Body('name') name: string, @Body('description') description?: string) {
    return this.service.createRole(name, description);
  }

  @Put('roles/:name')
  @ApiOperation({ summary: 'Actualizar un rol' })
  async updateRole(@Param('name') name: string, @Body('description') description?: string) {
    return this.service.updateRole(name, { description });
  }

  @Delete('roles/:name')
  @ApiOperation({ summary: 'Eliminar un rol' })
  async deleteRole(@Param('name') name: string) {
    return this.service.deleteRole(name);
  }

  @Get('role/:role')
  @ApiOperation({ summary: 'Permisos de un rol' })
  async findByRole(@Param('role') role: string) {
    return this.service.findPermissionsByRole(role);
  }

  @Post('role')
  @ApiOperation({ summary: 'Actualizar permisos de un rol' })
  async updateRolePermissions(@Body() dto: UpdateRolePermissionsDto) {
    return this.service.updateRolePermissions(dto.role, dto.permissionIds);
  }
}
