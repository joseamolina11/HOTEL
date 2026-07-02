import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api/users.api';
import { permissionsApi, RoleItem } from '@/api/permissions.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { useAuthStore } from '@/stores/auth.store';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Pencil, UserX, UserCheck } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { confirmAction, toastSuccess } from '@/lib/notifications';

function UserEditDialog({ user, onSuccess, open, onOpenChange, roles }: { user: any; onSuccess: () => void; open: boolean; onOpenChange: (v: boolean) => void; roles: RoleItem[] }) {
  const [nombres, setNombres] = useState(user?.nombres || '');
  const [apellidos, setApellidos] = useState(user?.apellidos || '');
  const [role, setRole] = useState(user?.role || 'reception');
  const roleOpts = (roles ?? []).map(r => ({ value: r.name, label: r.name }));

  const updateMut = useMutation({
    mutationFn: (dto: any) => usersApi.update(user.id, dto),
    onSuccess: () => { toastSuccess('Usuario actualizado'); onSuccess(); onOpenChange(false); },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Editar Usuario</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nombres</label>
            <Input value={nombres} onChange={(e) => setNombres(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Apellidos</label>
            <Input value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Rol</label>
            <Select options={roleOpts} value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
          <Button onClick={() => updateMut.mutate({ nombres, apellidos, role })} disabled={updateMut.isPending}>
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateUserDialog({ open, onOpenChange, onSuccess, roles }: { open: boolean; onOpenChange: (v: boolean) => void; onSuccess: () => void; roles: RoleItem[] }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [role, setRole] = useState('reception');
  const roleOpts = (roles ?? []).map(r => ({ value: r.name, label: r.name }));

  const createMut = useMutation({
    mutationFn: (dto: any) => usersApi.create(dto),
    onSuccess: () => { toastSuccess('Usuario creado'); onSuccess(); onOpenChange(false); setEmail(''); setPassword(''); setNombres(''); setApellidos(''); setRole('reception'); },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nuevo Usuario</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Contraseña</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Nombres</label>
            <Input value={nombres} onChange={(e) => setNombres(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Apellidos</label>
            <Input value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Rol</label>
            <Select options={roleOpts} value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
          <Button
            onClick={() => createMut.mutate({ email, password, nombres, apellidos, role })}
            disabled={!email || !password || !nombres || !apellidos || createMut.isPending}
          >
            Crear Usuario
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function UsersListPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => permissionsApi.getRoles(),
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => usersApi.findAll({ page: String(page), limit: '10' }),
  });

  const users = response?.data?.data || [];
  const totalPages = response?.data?.totalPages || 1;

  const toggleActiveMut = useMutation({
    mutationFn: (id: string) => usersApi.toggleActive(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); },
  });

  const handleToggleActive = async (user: any) => {
    const action = user.activo ? 'desactivar' : 'activar';
    const result = await confirmAction('Confirmar', `¿Estás seguro de ${action} este usuario?`);
    if (result.isConfirmed) {
      toggleActiveMut.mutate(user.id);
    }
  };

  const filtered = users.filter((u: any) =>
    u.nombres?.toLowerCase().includes(filter.toLowerCase()) ||
    u.apellidos?.toLowerCase().includes(filter.toLowerCase()) ||
    u.email?.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar usuario..." className="pl-10" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <Button onClick={() => setOpenCreate(true)}><Plus className="mr-2 h-4 w-4" /> Nuevo Usuario</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Todos los Usuarios</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-32 animate-pulse bg-muted rounded" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Nombre</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Rol</th>
                    <th className="pb-3 font-medium">Estado</th>
                    <th className="pb-3 font-medium">Creado</th>
                    <th className="pb-3 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user: any) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="py-3">{user.nombres} {user.apellidos}</td>
                      <td className="py-3 text-muted-foreground">{user.email}</td>
                      <td className="py-3">
                        <Badge variant="outline" className="capitalize">{user.role}</Badge>
                      </td>
                      <td className="py-3">
                        <Badge variant={user.activo ? 'default' : 'secondary'}>
                          {user.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">{formatDateTime(user.createdAt)}</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditingUser(user)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {currentUser?.id !== user.id && (
                            <Button variant="ghost" size="icon" onClick={() => handleToggleActive(user)}>
                              {user.activo ? <UserX className="h-4 w-4 text-destructive" /> : <UserCheck className="h-4 w-4 text-green-500" />}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Sin usuarios registrados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />

      <CreateUserDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        onSuccess={() => qc.invalidateQueries({ queryKey: ['users'] })}
        roles={roles ?? []}
      />

      {editingUser && (
        <UserEditDialog
          user={editingUser}
          roles={roles ?? []}
          open={!!editingUser}
          onOpenChange={(v) => !v && setEditingUser(null)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ['users'] })}
        />
      )}
    </div>
  );
}
