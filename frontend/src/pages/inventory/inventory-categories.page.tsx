import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/api/inventory.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toastSuccess } from '@/lib/notifications';

export function InventoryCategoriesPage() {
  const qc = useQueryClient();
  const [openAdd, setOpenAdd] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const { data: categories, isLoading } = useQuery({
    queryKey: ['inventory-categories'],
    queryFn: () => inventoryApi.findCategories(),
  });

  const createMut = useMutation({
    mutationFn: () => inventoryApi.createCategory(nombre, descripcion || undefined),
    onSuccess: () => {
      toastSuccess('Categoría creada');
      qc.invalidateQueries({ queryKey: ['inventory-categories'] });
      setOpenAdd(false);
      setNombre('');
      setDescripcion('');
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => inventoryApi.removeCategory(id),
    onSuccess: () => {
      toastSuccess('Categoría eliminada');
      qc.invalidateQueries({ queryKey: ['inventory-categories'] });
    },
  });

  const openEdit = (cat: any) => {
    setEditing(cat);
    setNombre(cat.nombre);
    setDescripcion(cat.descripcion || '');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categorías de Productos</h1>
        <Button onClick={() => { setEditing(null); setNombre(''); setDescripcion(''); setOpenAdd(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Categoría
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {categories?.length || 0} categoría{(categories?.length || 0) !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium">Descripción</th>
                  <th className="px-4 py-3 text-center font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                ) : categories?.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Sin categorías registradas</td></tr>
                ) : (
                  categories?.map((cat: any) => (
                    <tr key={cat.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{cat.nombre}</td>
                      <td className="px-4 py-3 text-muted-foreground">{cat.descripcion || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(cat.id)}>
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

      <Dialog open={openAdd || !!editing} onOpenChange={(v) => { if (!v) { setOpenAdd(false); setEditing(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar' : 'Nueva'} Categoría</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre de la categoría" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción</label>
              <Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Opcional" />
            </div>
            <Button
              className="w-full"
              disabled={!nombre || createMut.isPending}
              onClick={() => {
                if (editing) {
                  inventoryApi.updateCategory(editing.id, { nombre, descripcion: descripcion || undefined }).then(() => {
                    toastSuccess('Categoría actualizada');
                    qc.invalidateQueries({ queryKey: ['inventory-categories'] });
                    setEditing(null);
                    setNombre('');
                    setDescripcion('');
                  });
                } else {
                  createMut.mutate();
                }
              }}
            >
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {editing ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
