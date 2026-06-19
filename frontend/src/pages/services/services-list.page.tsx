import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '@/api/services.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { confirmAction, toastSuccess } from '@/lib/notifications';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatCurrency } from '@/lib/utils';

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  precio: z.coerce.number().min(0, 'Mín 0'),
});

export function ServicesListPage() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const qc = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ['services', page],
    queryFn: () => servicesApi.findAll(page),
  });
  const services = response?.data?.data || [];
  const totalPages = response?.data?.totalPages || 1;

  const createMut = useMutation({
    mutationFn: (dto: any) => servicesApi.create(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); toastSuccess('Servicio creado'); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => servicesApi.update(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); toastSuccess('Servicio actualizado'); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => servicesApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); toastSuccess('Servicio eliminado'); },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: any) => {
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, dto: data });
    } else {
      await createMut.mutateAsync(data);
    }
    setOpen(false);
    setEditing(null);
    reset();
  };

  const openEdit = (svc: any) => {
    setEditing(svc);
    reset({ nombre: svc.nombre, descripcion: svc.descripcion || '', precio: svc.precio });
    setOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    reset({ nombre: '', descripcion: '', precio: 0 });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Servicios</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); reset(); } }}>
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Nuevo Servicio</Button>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Servicio' : 'Nuevo Servicio'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre</label>
                <Input {...register('nombre')} placeholder="Ej: Lavandería" />
                {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message as string}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descripción</label>
                <Input {...register('descripcion')} placeholder="Opcional" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Precio</label>
                <Input type="number" step="0.01" {...register('precio')} placeholder="0.00" />
                {errors.precio && <p className="text-xs text-destructive">{errors.precio.message as string}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={createMut.isPending || updateMut.isPending}>
                {editing ? 'Actualizar' : 'Crear'} Servicio
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium">Descripción</th>
                  <th className="px-4 py-3 text-right font-medium">Precio</th>
                  <th className="px-4 py-3 text-center font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                ) : services.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Sin servicios registrados</td></tr>
                ) : (
                  services.map((s: any) => (
                    <tr key={s.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{s.nombre}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.descripcion || '—'}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(s.precio)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={s.activo ? 'default' : 'secondary'}>{s.activo ? 'Activo' : 'Inactivo'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={async () => { const r = await confirmAction('¿Eliminar servicio?', 'Esta acción no se puede deshacer'); if (r.isConfirmed) deleteMut.mutate(s.id); }}>
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
