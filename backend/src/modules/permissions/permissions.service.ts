import { Injectable, OnModuleInit, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Role } from './entities/role.entity';
import { ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from './seed/permissions.seed';

@Injectable()
export class PermissionsService implements OnModuleInit {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async onModuleInit() {
    await this.seedSystemRoles();
    await this.seedPermissions();
  }

  private async seedSystemRoles() {
    const roleDescriptions: Record<string, string> = {
      admin: 'Acceso completo al sistema',
      reception: 'Operaciones de recepción y reservas',
      limpieza: 'Gestión de housekeeping y habitaciones',
      mantenimiento: 'Tareas de mantenimiento y habitaciones',
    };

    for (const [name, description] of Object.entries(roleDescriptions)) {
      const exists = await this.roleRepo.findOne({ where: { name } });
      if (!exists) {
        await this.roleRepo.save(this.roleRepo.create({ name, description, isSystem: true }));
      }
    }
  }

  private async seedPermissions() {
    const count = await this.permissionRepo.count();
    if (count > 0) return;

    this.logger.log('Seeding permissions...');

    const savedPermissions = await this.permissionRepo.save(
      ALL_PERMISSIONS.map(p => this.permissionRepo.create(p)),
    );

    const permissionMap = new Map<string, Permission>();
    for (const p of savedPermissions) {
      permissionMap.set(`${p.module}:${p.action}`, p);
    }

    const rolePermissions: RolePermission[] = [];
    for (const [role, keys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      for (const key of keys) {
        const perm = permissionMap.get(key);
        if (perm) {
          rolePermissions.push(this.rolePermissionRepo.create({ role, permissionId: perm.id }));
        }
      }
    }

    await this.rolePermissionRepo.save(rolePermissions);
    this.logger.log(`Seeded ${savedPermissions.length} permissions for ${Object.keys(DEFAULT_ROLE_PERMISSIONS).length} roles`);
  }

  async findAllPermissions() {
    return this.permissionRepo.find({ order: { moduloNombre: 'ASC', nombre: 'ASC' } });
  }

  async findPermissionsByRole(role: string) {
    const rps = await this.rolePermissionRepo.find({
      where: { role },
      relations: ['permission'],
    });
    return rps.map(rp => ({
      id: rp.permissionId,
      module: rp.permission.module,
      action: rp.permission.action,
      nombre: rp.permission.nombre,
      moduloNombre: rp.permission.moduloNombre,
    }));
  }

  async getRoles() {
    return this.roleRepo.find({ order: { name: 'ASC' } });
  }

  async updateRolePermissions(role: string, permissionIds: string[]) {
    await this.rolePermissionRepo.delete({ role });
    if (permissionIds.length > 0) {
      const rps = permissionIds.map(pid =>
        this.rolePermissionRepo.create({ role, permissionId: pid }),
      );
      await this.rolePermissionRepo.save(rps);
    }
    return this.findPermissionsByRole(role);
  }

  async getPermissionsForRole(role: string): Promise<string[]> {
    const rps = await this.rolePermissionRepo.find({
      where: { role },
      relations: ['permission'],
    });
    return rps.map(rp => `${rp.permission.module}:${rp.permission.action}`);
  }

  async createRole(name: string, description?: string) {
    const existing = await this.roleRepo.findOne({ where: { name } });
    if (existing) throw new ConflictException(`El rol "${name}" ya existe`);
    return this.roleRepo.save(this.roleRepo.create({ name, description }));
  }

  async updateRole(name: string, data: { description?: string }) {
    const role = await this.roleRepo.findOne({ where: { name } });
    if (!role) throw new NotFoundException(`Rol "${name}" no encontrado`);
    if (data.description !== undefined) role.description = data.description;
    return this.roleRepo.save(role);
  }

  async deleteRole(name: string) {
    const role = await this.roleRepo.findOne({ where: { name } });
    if (!role) throw new NotFoundException(`Rol "${name}" no encontrado`);
    if (role.isSystem) throw new ConflictException('No se puede eliminar un rol del sistema');
    await this.rolePermissionRepo.delete({ role: name });
    await this.roleRepo.remove(role);
    return { deleted: true };
  }

  async getAllModules() {
    const perms = await this.permissionRepo
      .createQueryBuilder('p')
      .select('p.module', 'module')
      .addSelect('p.moduloNombre', 'moduloNombre')
      .distinct(true)
      .orderBy('p.moduloNombre', 'ASC')
      .getRawMany();
    return perms.map(p => ({ module: p.p_module, moduloNombre: p.p_moduloNombre }));
  }
}
