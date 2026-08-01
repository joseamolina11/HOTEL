import { Controller, Get, Patch, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationQueryDto } from './dto/notification.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('Notificaciones')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar mis notificaciones (paginadas)' })
  findAll(@CurrentUser('sub') userId: string, @Query() query: NotificationQueryDto) {
    return this.service.findAll(userId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Cantidad de notificaciones sin leer' })
  unreadCount(@CurrentUser('sub') userId: string) {
    return this.service.unreadCount(userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Marcar todas como leídas' })
  markAllRead(@CurrentUser('sub') userId: string) {
    return this.service.markAllRead(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar una notificación como leída' })
  @ApiParam({ name: 'id' })
  markRead(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.service.markRead(userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una notificación' })
  @ApiParam({ name: 'id' })
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.service.remove(userId, id);
  }
}
