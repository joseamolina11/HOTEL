import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationQueryDto } from './dto/notification.dto';
import { User } from 'src/modules/auth/entities/user.entity';

export interface NotifyInput {
  tipo: 'evento' | 'bitacora';
  titulo: string;
  mensaje: string;
  entidadId?: string;
  actorId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async notifyAll(input: NotifyInput): Promise<void> {
    const users = await this.userRepository.find({ where: { activo: true } });
    if (!users.length) return;

    const actor = input.actorId
      ? await this.userRepository.findOne({ where: { id: input.actorId } })
      : null;
    const actorName = actor ? `${actor.nombres} ${actor.apellidos}`.trim() : '';
    const mensaje = actorName ? `${actorName}: ${input.mensaje}` : input.mensaje;

    const notifications = users.map((u) =>
      this.notificationRepository.create({
        userId: u.id,
        tipo: input.tipo,
        titulo: input.titulo,
        mensaje,
        entidadId: input.entidadId ?? null,
        createdById: input.actorId ?? null,
      }),
    );

    await this.notificationRepository.save(notifications);
  }

  async findAll(userId: string, query: NotificationQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async unreadCount(userId: string) {
    return this.notificationRepository.count({ where: { userId, leida: false } });
  }

  async markRead(userId: string, id: string): Promise<Notification | null> {
    const notification = await this.notificationRepository.findOne({ where: { id, userId } });
    if (!notification) return null;

    notification.leida = true;
    notification.leidaAt = new Date();
    return this.notificationRepository.save(notification);
  }

  async markAllRead(userId: string) {
    const result = await this.notificationRepository.update(
      { userId, leida: false },
      { leida: true, leidaAt: new Date() },
    );
    return { updated: result.affected ?? 0 };
  }

  async remove(userId: string, id: string) {
    const notification = await this.notificationRepository.findOne({ where: { id, userId } });
    if (!notification) return { success: false };

    await this.notificationRepository.remove(notification);
    return { success: true };
  }
}
