import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/api/inventory.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useCreateInventoryItem, useUpdateInventoryItem } from '@/hooks/useInventory';
import { Package, Plus, Loader2 } from 'lucide-react';
import { toastSuccess } from '@/lib/notifications';
import { useState } from 'react';

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  categoria: z.string().min(1, 'Categoría requerida'),
  categoryId: z.string().optional(),
  stockActual: z.coerce.number().min(0, 'Stock inválido'),
  stockMinimo: z.coerce.number().min(0, 'Stock mínimo inválido'),
  costoUnitario: z.coerce.number().min(0, 'Costo inválido'),
  precioVenta: z.coerce.number().min(0, 'Precio inválido').optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onSuccess: () => void;
  initial?: any;
  defaultCategoria?: string;
}

export function InventoryItemForm({ onSuccess, initial, defaultCategoria }: Props) {
  const qc = useQueryClient();
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const create = useCreateInventoryItem();
  const update = useUpdateInventoryItem();
  const isEdit = !!initial;

  const { data: categories } = useQuery({
    queryKey: ['inventory-categories'],
    queryFn: () => inventoryApi.findCategories(),
  });

  const createCategory = useMutation({
    mutationFn: (name: string) => inventoryApi.createCategory(name),
    onSuccess: (data: any) => {
      toastSuccess('Categoría creada');
      setValue('categoryId', data.id);
      setValue('categoria', data.nombre);
      setShowNewCat(false);
      setNewCatName('');
      qc.invalidateQueries({ queryKey: ['inventory-categories'] });
    },
  });

  const catOpts = (categories || []).map((c: any) => ({ value: c.id, label: c.nombre }));

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initial ? {
      nombre: initial.nombre,
      categoria: initial.categoria,
      categoryId: initial.categoryId || '',
      stockActual: initial.stockActual,
      stockMinimo: initial.stockMinimo,
      costoUnitario: initial.costoUnitario,
      precioVenta: initial.precioVenta || 0,
    } : { stockActual: 0, stockMinimo: 0, costoUnitario: 0, precioVenta: 0, categoria: defaultCategoria || '' },
  });

  const onSubmit = async (data: FormData) => {
    if (isEdit) {
      await update.mutateAsync({ id: initial.id, dto: data });
    } else {
      await create.mutateAsync(data);
    }
    onSuccess();
  };

  const isPending = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Package className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{isEdit ? 'Editar' : 'Nuevo'} producto</span>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Nombre</label>
        <Input {...register('nombre')} placeholder="Nombre del producto" />
        {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Categoría</label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Select {...register('categoryId')} placeholder="Seleccionar categoría" options={catOpts} onChange={(e) => {
              const cat = (categories || []).find((c: any) => c.id === e.target.value);
              setValue('categoryId', e.target.value);
              setValue('categoria', cat?.nombre || '');
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
        <input type="hidden" {...register('categoria')} />
        {errors.categoria && <p className="text-xs text-destructive">{errors.categoria.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Stock</label>
          <Input type="number" {...register('stockActual')} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Stock Mín.</label>
          <Input type="number" {...register('stockMinimo')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Costo Unitario</label>
          <Input type="number" step="0.01" {...register('costoUnitario')} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Precio Venta</label>
          <Input type="number" step="0.01" {...register('precioVenta')} />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Guardando...' : isEdit ? 'Actualizar Producto' : 'Crear Producto'}
      </Button>
    </form>
  );
}
