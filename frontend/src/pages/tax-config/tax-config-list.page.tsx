import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taxConfigApi } from '@/api/tax-config.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { confirmAction, toastSuccess } from '@/lib/notifications';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  tasa: z.coerce.number().min(0, 'Mín 0').max(100, 'Máx 100'),
  esDefecto: z.boolean().optional(),
});

export function TaxConfigListPage() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const qc = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ['tax-config', page],
    queryFn: () => taxConfigApi.findAll(page),
  });
  const taxes = response?.data?.data || [];
  const totalPages = response?.data?.totalPages || 1;

  const createMut = useMutation({
    mutationFn: (dto: any) => taxConfigApi.create(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tax-config'] }); toastSuccess('Impuesto creado'); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => taxConfigApi.update(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tax-config'] }); toastSuccess('Impuesto actualizado'); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => taxConfigApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tax-config'] }); toastSuccess('Impuesto eliminado'); },
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

  const openEdit = (tax: any) => {
    setEditing(tax);
    reset({ nombre: tax.nombre, tasa: tax.tasa, esDefecto: tax.esDefecto });
    setOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    reset({ nombre: '', tasa: 19, esDefecto: false });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Configuración de Impuestos</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); reset(); } }}>
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Nuevo Impuesto</Button>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Impuesto' : 'Nuevo Impuesto'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre</label>
                <Input {...register('nombre')} placeholder="Ej: IVA 19%" />
                {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message as string}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tasa (%)</label>
                <Input type="number" step="0.01" {...register('tasa')} placeholder="19" />
                {errors.tasa && <p className="text-xs text-destructive">{errors.tasa.message as string}</p>}
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="esDefecto" {...register('esDefecto')} className="h-4 w-4 rounded border-gray-300" />
                <label htmlFor="esDefecto" className="text-sm font-medium">Impuesto por defecto</label>
              </div>
              <Button type="submit" className="w-full" disabled={createMut.isPending || updateMut.isPending}>
                {editing ? 'Actualizar' : 'Crear'} Impuesto
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
                  <th className="px-4 py-3 text-right font-medium">Tasa</th>
                  <th className="px-4 py-3 text-center font-medium">Defecto</th>
                  <th className="px-4 py-3 text-center font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                ) : taxes.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Sin impuestos configurados</td></tr>
                ) : (
                  taxes.map((t: any) => (
                    <tr key={t.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{t.nombre}</td>
                      <td className="px-4 py-3 text-right">{t.tasa}%</td>
                      <td className="px-4 py-3 text-center">
                        {t.esDefecto ? <Star className="h-4 w-4 inline text-yellow-500" fill="currentColor" /> : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={t.activo ? 'default' : 'secondary'}>{t.activo ? 'Activo' : 'Inactivo'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={async () => { const r = await confirmAction('¿Eliminar impuesto?', 'Esta acción no se puede deshacer'); if (r.isConfirmed) deleteMut.mutate(t.id); }}>
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
