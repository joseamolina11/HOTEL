import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/update-user.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions('users:create')
  @ApiOperation({ summary: 'Crear usuario (admin only)' })
  async create(@Body() createDto: CreateUserDto) {
    return this.usersService.create(createDto);
  }

  @Get()
  @Permissions('users:view')
  @ApiOperation({ summary: 'Listar usuarios (admin only)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.usersService.findAll(+page, +limit);
  }

  @Get(':id')
  @Permissions('users:view')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @Permissions('users:edit')
  @ApiOperation({ summary: 'Actualizar usuario' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    return this.usersService.update(id, updateDto);
  }

  @Put(':id/toggle-active')
  @Permissions('users:manage-roles')
  @ApiOperation({ summary: 'Activar/desactivar usuario' })
  async toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }
}
