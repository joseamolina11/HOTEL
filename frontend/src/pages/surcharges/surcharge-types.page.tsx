import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { surchargeTypesApi } from '@/api/surcharge-types.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toastSuccess } from '@/lib/notifications';
import { formatCurrency } from '@/lib/utils';
import { Plus, Pencil, Trash2, Loader2, Zap } from 'lucide-react';

export function SurchargeTypesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [montoDefault, setMontoDefault] = useState(0);
  const [tipo, setTipo] = useState<'fijo' | 'por_noche' | 'porcentaje'>('fijo');

  const { data: types, isLoading } = useQuery({
    queryKey: ['surcharge-types'],
    queryFn: () => surchargeTypesApi.findAll(),
  });

  const createMut = useMutation({
    mutationFn: (dto: any) => surchargeTypesApi.create(dto),
    onSuccess: () => {
      toastSuccess('Tipo de recargo creado');
      qc.invalidateQueries({ queryKey: ['surcharge-types'] });
      resetForm();
      setOpen(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => surchargeTypesApi.update(id, dto),
    onSuccess: () => {
      toastSuccess('Tipo de recargo actualizado');
      qc.invalidateQueries({ queryKey: ['surcharge-types'] });
      resetForm();
      setOpen(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => surchargeTypesApi.remove(id),
    onSuccess: () => {
      toastSuccess('Tipo de recargo eliminado');
      qc.invalidateQueries({ queryKey: ['surcharge-types'] });
    },
  });

  const resetForm = () => {
    setNombre('');
    setDescripcion('');
    setMontoDefault(0);
    setTipo('fijo');
    setEditing(null);
  };

  const openEdit = (st: any) => {
    setEditing(st);
    setNombre(st.nombre);
    setDescripcion(st.descripcion || '');
    setMontoDefault(Number(st.montoDefault));
    setTipo(st.tipo);
    setOpen(true);
  };

  const handleSubmit = () => {
    const dto = { nombre, descripcion, montoDefault, tipo, activo: true };
    if (editing) {
      updateMut.mutate({ id: editing.id, dto });
    } else {
      createMut.mutate(dto);
    }
  };

  const tipoLabels: Record<string, string> = { fijo: 'Fijo', por_noche: 'Por noche', porcentaje: 'Porcentaje' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tipos de Recargo</h1>
        <Button onClick={() => { resetForm(); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Tipo
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium">Descripción</th>
                  <th className="px-4 py-3 text-right font-medium">Monto</th>
                  <th className="px-4 py-3 text-center font-medium">Tipo</th>
                  <th className="px-4 py-3 text-center font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                ) : (types || []).length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Sin tipos de recargo registrados</td></tr>
                ) : (
                  (types || []).map((st: any) => (
                    <tr key={st.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500" /> {st.nombre}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{st.descripcion || '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(Number(st.montoDefault))}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline">{tipoLabels[st.tipo] || st.tipo}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={st.activo ? 'default' : 'secondary'}>{st.activo ? 'Activo' : 'Inactivo'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(st)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(st.id)}>
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

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Tipo de Recargo' : 'Nuevo Tipo de Recargo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium">Nombre *</label>
              <Input placeholder="Ej: Persona extra" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Descripción</label>
              <Input placeholder="Opcional" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Monto *</label>
                <Input type="number" min={0} value={montoDefault || ''} onChange={(e) => setMontoDefault(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Tipo</label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={tipo} onChange={(e) => setTipo(e.target.value as any)}>
                  <option value="fijo">Fijo (una vez)</option>
                  <option value="por_noche">Por noche</option>
                  <option value="porcentaje">Porcentaje</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              </DialogClose>
              <Button onClick={handleSubmit} disabled={!nombre || montoDefault <= 0 || createMut.isPending || updateMut.isPending}>
                {(createMut.isPending || updateMut.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
