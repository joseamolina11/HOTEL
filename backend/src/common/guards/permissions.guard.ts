import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ROLES } from '../constants';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Usuario no autenticado');

    // Admin bypass: admin has all permissions
    if (user.role === ROLES.ADMIN) return true;

    const userPermissions: string[] = user.permissions || [];
    const hasPermission = requiredPermissions.some(p => userPermissions.includes(p));

    if (!hasPermission) {
      throw new ForbiddenException('No tienes permisos para realizar esta acción');
    }

    return true;
  }
}
