import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionsApi, RoleItem } from '@/api/permissions.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Save, Plus, Trash2 } from 'lucide-react';
import { toastSuccess } from '@/lib/notifications';
import { confirmAction } from '@/lib/notifications';

function CreateRoleDialog({ open, onOpenChange, onSuccess }: { open: boolean; onOpenChange: (v: boolean) => void; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const createMut = useMutation({
    mutationFn: (dto: { name: string; description?: string }) => permissionsApi.createRole(dto.name, dto.description),
    onSuccess: () => { toastSuccess('Rol creado'); onSuccess(); onOpenChange(false); setName(''); setDescription(''); },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nuevo Rol</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nombre del rol</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ej: compras" />
          </div>
          <div>
            <label className="text-sm font-medium">Descripción</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" />
          </div>
          <Button onClick={() => createMut.mutate({ name, description })} disabled={!name || createMut.isPending}>
            {createMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Crear Rol
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PermissionsPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [openCreate, setOpenCreate] = useState(false);
  const qc = useQueryClient();

  const { data: roles, isLoading: loadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => permissionsApi.getRoles(),
  });

  const { data: allPermissions, isLoading: loadingPerms } = useQuery({
    queryKey: ['permissions', 'all'],
    queryFn: () => permissionsApi.findAll(),
  });

  const { data: rolePermissions, isLoading: loadingRole } = useQuery({
    queryKey: ['permissions', 'role', selectedRole],
    queryFn: () => permissionsApi.getPermissionsForRole(selectedRole!),
    enabled: !!selectedRole,
  });

  useEffect(() => {
    if (roles && roles.length > 0 && !selectedRole) {
      setSelectedRole(roles[0].name);
    }
  }, [roles, selectedRole]);

  useEffect(() => {
    if (rolePermissions) {
      setSelectedPermissions(new Set(rolePermissions.map((p: any) => p.id)));
    }
  }, [rolePermissions]);

  const saveMut = useMutation({
    mutationFn: (permissionIds: string[]) =>
      permissionsApi.updateRolePermissions(selectedRole!, permissionIds),
    onSuccess: () => {
      toastSuccess('Permisos actualizados');
      qc.invalidateQueries({ queryKey: ['permissions', 'role', selectedRole] });
    },
  });

  const deleteRoleMut = useMutation({
    mutationFn: (name: string) => permissionsApi.deleteRole(name),
    onSuccess: () => {
      toastSuccess('Rol eliminado');
      qc.invalidateQueries({ queryKey: ['roles'] });
      if (selectedRole && roles) {
        const remaining = (roles as RoleItem[]).filter(r => r.name !== selectedRole);
        setSelectedRole(remaining.length > 0 ? remaining[0].name : null);
      }
    },
  });

  const handleDeleteRole = async (role: RoleItem) => {
    const result = await confirmAction('Eliminar Rol', `¿Estás seguro de eliminar el rol "${role.name}"?`);
    if (result.isConfirmed) {
      deleteRoleMut.mutate(role.name);
    }
  };

  const togglePermission = (id: string) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const groupedByModule = (allPermissions ?? []).reduce((acc: any, p: any) => {
    const key = p.moduloNombre || p.module;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {} as Record<string, any[]>);

  const selectedRoleObj = (roles ?? []).find((r: RoleItem) => r.name === selectedRole);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Roles y Permisos</h1>
        <Button onClick={() => setOpenCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Rol
        </Button>
      </div>

      {loadingRoles ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 items-center">
            {(roles ?? []).map((role: RoleItem) => (
              <div key={role.name} className="flex items-center gap-1">
                <Button
                  variant={selectedRole === role.name ? 'default' : 'outline'}
                  onClick={() => setSelectedRole(role.name)}
                >
                  {role.name}
                </Button>
                {!role.isSystem && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive"
                    onClick={() => handleDeleteRole(role)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {selectedRole && (loadingPerms || loadingRole) ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedRole ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">
                    Permisos - {selectedRoleObj?.name}{selectedRoleObj?.description ? ` (${selectedRoleObj.description})` : ''}
                  </CardTitle>
                  <Badge variant="outline">
                    {selectedPermissions.size} seleccionados
                  </Badge>
                </CardHeader>
                <CardContent>
                  {(Object.entries(groupedByModule) as [string, any[]][]).map(([moduleName, perms]) => (
                    <div key={moduleName} className="mb-6 last:mb-0">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 pb-1 border-b">
                        {moduleName}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {perms.map((p: any) => (
                          <label
                            key={p.id}
                            className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.has(p.id)}
                              onChange={() => togglePermission(p.id)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span>{p.nombre}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => {
                    if (rolePermissions) {
                      setSelectedPermissions(new Set(rolePermissions.map((p: any) => p.id)));
                    }
                  }}
                  variant="outline"
                >
                  Restaurar
                </Button>
                <Button
                  onClick={() => saveMut.mutate(Array.from(selectedPermissions))}
                  disabled={saveMut.isPending}
                >
                  {saveMut.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Guardar Cambios
                </Button>
              </div>
            </>
          ) : null}
        </>
      )}

      <CreateRoleDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        onSuccess={() => qc.invalidateQueries({ queryKey: ['roles'] })}
      />
    </div>
  );
}
