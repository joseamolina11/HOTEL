import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/api/inventory.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useCreateInventoryItem, useCreateMovement } from '@/hooks/useInventory';
import { Package, Plus, ArrowDownUp, Loader2 } from 'lucide-react';
import { toastSuccess } from '@/lib/notifications';

const itemSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  categoria: z.string().min(1, 'Categoría requerida'),
  categoryId: z.string().optional(),
  stockActual: z.coerce.number().min(0, 'Stock inválido'),
  stockMinimo: z.coerce.number().min(0, 'Stock mínimo inválido'),
  costoUnitario: z.coerce.number().min(0, 'Costo inválido'),
});

const movementSchema = z.object({
  inventoryItemId: z.string().min(1, 'Selecciona un producto'),
  tipo: z.enum(['entrada', 'salida', 'ajuste']),
  cantidad: z.coerce.number().min(1, 'Cantidad debe ser mayor a 0'),
  precioUnitario: z.coerce.number().min(0, 'Precio inválido').optional(),
  observaciones: z.string().optional(),
});

type ItemFormData = z.infer<typeof itemSchema>;
type MovementFormData = z.infer<typeof movementSchema>;

interface InventoryFormProps {
  onSuccess: () => void;
  items?: { value: string; label: string }[];
}

export function InventoryForm({ onSuccess, items = [] }: InventoryFormProps) {
  const qc = useQueryClient();
  const [mode, setMode] = useState<'item' | 'movement'>('item');
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const createItem = useCreateInventoryItem();
  const createMovement = useCreateMovement();

  const { data: categories } = useQuery({
    queryKey: ['inventory-categories'],
    queryFn: () => inventoryApi.findCategories(),
  });

  const createCategory = useMutation({
    mutationFn: (name: string) => inventoryApi.createCategory(name),
    onSuccess: (data: any) => {
      toastSuccess('Categoría creada');
      itemForm.setValue('categoryId', data.id);
      itemForm.setValue('categoria', data.nombre);
      setShowNewCat(false);
      setNewCatName('');
      qc.invalidateQueries({ queryKey: ['inventory-categories'] });
    },
  });

  const catOpts = (categories || []).map((c: any) => ({ value: c.id, label: c.nombre }));

  const itemForm = useForm<ItemFormData>({ resolver: zodResolver(itemSchema) });
  const movForm = useForm<MovementFormData>({ resolver: zodResolver(movementSchema) });

  const onItemSubmit = async (data: ItemFormData) => {
    await createItem.mutateAsync(data);
    itemForm.reset();
    onSuccess();
  };

  const onMovementSubmit = async (data: MovementFormData) => {
    await createMovement.mutateAsync(data);
    movForm.reset();
    onSuccess();
  };

  const movTipo = movForm.watch('tipo');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button type="button" variant={mode === 'item' ? 'default' : 'outline'} size="sm" onClick={() => setMode('item')}>
          <Package className="mr-1 h-3 w-3" /> Nuevo Producto
        </Button>
        <Button type="button" variant={mode === 'movement' ? 'default' : 'outline'} size="sm" onClick={() => setMode('movement')}>
          <ArrowDownUp className="mr-1 h-3 w-3" /> Movimiento
        </Button>
      </div>

      {mode === 'item' ? (
        <form onSubmit={itemForm.handleSubmit(onItemSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre</label>
            <Input {...itemForm.register('nombre')} placeholder="Agua mineral" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoría</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select {...itemForm.register('categoryId')} placeholder="Seleccionar categoría" options={catOpts} onChange={(e) => {
                  const cat = (categories || []).find((c: any) => c.id === e.target.value);
                  itemForm.setValue('categoryId', e.target.value);
                  itemForm.setValue('categoria', cat?.nombre || '');
                }} />
              </div>
              {!showNewCat && (
                <Button type="button" variant="outline" size="icon" onClick={() => setShowNewCat(true)} title="Nueva categoría">
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
            {showNewCat && (
              <div className="flex gap-2">
                <Input placeholder="Nombre categoría" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
                <Button type="button" size="sm" disabled={!newCatName || createCategory.isPending} onClick={() => createCategory.mutate(newCatName)}>
                  {createCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear'}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewCat(false)}>X</Button>
              </div>
            )}
            <input type="hidden" {...itemForm.register('categoria')} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Stock</label>
              <Input type="number" {...itemForm.register('stockActual')} placeholder="0" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Stock Mín.</label>
              <Input type="number" {...itemForm.register('stockMinimo')} placeholder="0" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Costo</label>
              <Input type="number" step="0.01" {...itemForm.register('costoUnitario')} placeholder="0" />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={createItem.isPending}>
            {createItem.isPending ? 'Creando...' : 'Crear Producto'}
          </Button>
        </form>
      ) : (
        <form onSubmit={movForm.handleSubmit(onMovementSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Producto</label>
            <Select {...movForm.register('inventoryItemId')} placeholder="Seleccionar producto" options={items} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo</label>
            <Select {...movForm.register('tipo')} placeholder="Tipo de movimiento" options={[
              { value: 'entrada', label: 'Entrada' },
              { value: 'salida', label: 'Salida' },
              { value: 'ajuste', label: 'Ajuste' },
            ]} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Cantidad</label>
            <Input type="number" {...movForm.register('cantidad')} placeholder="1" />
          </div>
          {movTipo === 'entrada' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Costo unitario (entrada)</label>
              <Input type="number" step="0.01" min={0} {...movForm.register('precioUnitario')} />
              <p className="text-xs text-muted-foreground">Costo al que ingresó este producto</p>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Observaciones</label>
            <Input {...movForm.register('observaciones')} placeholder="Opcional" />
          </div>
          <Button type="submit" className="w-full" disabled={createMovement.isPending}>
            {createMovement.isPending ? 'Procesando...' : 'Registrar Movimiento'}
          </Button>
        </form>
      )}
    </div>
  );
}
