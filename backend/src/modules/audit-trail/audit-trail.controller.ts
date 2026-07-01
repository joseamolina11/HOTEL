import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuditTrailService } from './audit-trail.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ROLES } from 'src/common/constants';

@ApiTags('Audit Trail')
@Controller('audit-trail')
export class AuditTrailController {
  constructor(private readonly service: AuditTrailService) {}

  @Get()
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Listar logs de auditoría' })
  @ApiQuery({ name: 'entidad', required: false })
  @ApiQuery({ name: 'entidadId', required: false })
  async findAll(@Query('entidad') entidad?: string, @Query('entidadId') entidadId?: string) {
    return this.service.findAll({ entidad, entidadId });
  }

  @Get(':entidad/:entidadId')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Logs por entidad' })
  async findByEntity(@Param('entidad') entidad: string, @Param('entidadId') entidadId: string) {
    return this.service.findByEntity(entidad, entidadId);
  }
}
