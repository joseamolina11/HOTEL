import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tercerosApi } from '@/api/terceros.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { Plus, Pencil, Trash2, Search, Building2, User as UserIcon } from 'lucide-react';
import { confirmAction, toastSuccess } from '@/lib/notifications';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  tipo: z.enum(['empresa', 'persona']),
  documento: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().optional(),
  direccion: z.string().optional(),
  contacto: z.string().optional(),
  observaciones: z.string().optional(),
  activo: z.boolean().optional(),
});

export function TercerosPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const qc = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ['terceros', page, search],
    queryFn: () => tercerosApi.findAll({ page: String(page), limit: '10', search: search || undefined }),
  });
  const terceros = response?.data?.data || [];
  const totalPages = response?.data?.totalPages || 1;

  const createMut = useMutation({
    mutationFn: (dto: any) => tercerosApi.create(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['terceros'] }); toastSuccess('Tercero creado'); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => tercerosApi.update(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['terceros'] }); toastSuccess('Tercero actualizado'); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => tercerosApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['terceros'] }); toastSuccess('Tercero eliminado'); },
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: '',
      tipo: 'persona',
      documento: '',
      telefono: '',
      email: '',
      direccion: '',
      contacto: '',
      observaciones: '',
      activo: true,
    },
  });
  const tipo = watch('tipo');

  const onSubmit = async (data: any) => {
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, dto: data });
    } else {
      await createMut.mutateAsync(data);
    }
    setOpen(false);
    setEditing(null);
    reset({ tipo: 'persona', activo: true });
  };

  const openEdit = (t: any) => {
    setEditing(t);
    reset({
      nombre: t.nombre,
      tipo: t.tipo || 'persona',
      documento: t.documento || '',
      telefono: t.telefono || '',
      email: t.email || '',
      direccion: t.direccion || '',
      contacto: t.contacto || '',
      observaciones: t.observaciones || '',
      activo: t.activo,
    });
    setOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    reset({ nombre: '', tipo: 'persona', activo: true });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Terceros</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); reset({ tipo: 'persona', activo: true }); } }}>
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Nuevo Tercero</Button>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Tercero' : 'Nuevo Tercero'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre</label>
                  <Input {...register('nombre')} placeholder="Ej: Transportes Rápidos" />
                  {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message as string}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    value={tipo}
                    onChange={(e) => setValue('tipo', e.target.value as any, { shouldValidate: true })}
                  >
                    <option value="persona">Persona</option>
                    <option value="empresa">Empresa</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Documento</label>
                  <Input {...register('documento')} placeholder="NIT / Cédula" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Teléfono</label>
                  <Input {...register('telefono')} placeholder="Opcional" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input {...register('email')} placeholder="Opcional" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dirección</label>
                  <Input {...register('direccion')} placeholder="Opcional" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{tipo === 'empresa' ? 'Persona de contacto' : 'Contacto'}</label>
                <Input {...register('contacto')} placeholder="Opcional" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Observaciones</label>
                <Input {...register('observaciones')} placeholder="Opcional" />
              </div>
              <Button type="submit" className="w-full" disabled={createMut.isPending || updateMut.isPending}>
                {editing ? 'Actualizar' : 'Crear'} Tercero
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar tercero..."
          className="pl-10"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium">Documento</th>
                  <th className="px-4 py-3 text-left font-medium">Teléfono</th>
                  <th className="px-4 py-3 text-left font-medium">Contacto</th>
                  <th className="px-4 py-3 text-center font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                ) : terceros.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Sin terceros registrados</td></tr>
                ) : (
                  terceros.map((t: any) => (
                    <tr key={t.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {t.tipo === 'empresa' ? <Building2 className="h-4 w-4 text-muted-foreground" /> : <UserIcon className="h-4 w-4 text-muted-foreground" />}
                          <span className="font-medium">{t.nombre}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={t.tipo === 'empresa' ? 'default' : 'secondary'}>
                          {t.tipo === 'empresa' ? 'Empresa' : 'Persona'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{t.documento || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{t.telefono || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{t.contacto || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={t.activo ? 'success' : 'destructive'}>{t.activo ? 'Activo' : 'Inactivo'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={async () => { const r = await confirmAction('¿Eliminar tercero?', 'Esta acción no se puede deshacer'); if (r.isConfirmed) deleteMut.mutate(t.id); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
