import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliesApi } from '@/api/supplies.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useCreateSupplyItem, useUpdateSupplyItem } from '@/hooks/useSupplies';
import { Package, Plus, Loader2 } from 'lucide-react';
import { toastSuccess } from '@/lib/notifications';
import { useState } from 'react';

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  categoriaSuministro: z.string().min(1, 'Categoría requerida'),
  categoryId: z.string().optional(),
  unidadMedida: z.string().optional().default('unidad'),
  stockActual: z.coerce.number().min(0, 'Stock inválido'),
  stockMinimo: z.coerce.number().min(0, 'Stock mínimo inválido'),
  costoUnitario: z.coerce.number().min(0, 'Costo inválido'),
  proveedor: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onSuccess: () => void;
  initial?: any;
}

const UNIDADES_MEDIDA = [
  { value: 'unidad', label: 'Unidad' },
  { value: 'litro', label: 'Litro' },
  { value: 'kilogramo', label: 'Kilogramo' },
  { value: 'gramo', label: 'Gramo' },
  { value: 'mililitro', label: 'Mililitro' },
  { value: 'paquete', label: 'Paquete' },
  { value: 'caja', label: 'Caja' },
  { value: 'rollo', label: 'Rollo' },
  { value: 'par', label: 'Par' },
];

export function SupplyItemForm({ onSuccess, initial }: Props) {
  const qc = useQueryClient();
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const create = useCreateSupplyItem();
  const update = useUpdateSupplyItem();
  const isEdit = !!initial;

  const { data: categories } = useQuery({
    queryKey: ['supply-categories'],
    queryFn: () => suppliesApi.findCategories(),
  });

  const createCategory = useMutation({
    mutationFn: (name: string) => suppliesApi.createCategory(name),
    onSuccess: (data: any) => {
      toastSuccess('Categoría creada');
      setValue('categoryId', data.id);
      setValue('categoriaSuministro', data.nombre);
      setShowNewCat(false);
      setNewCatName('');
      qc.invalidateQueries({ queryKey: ['supply-categories'] });
    },
  });

  const catOpts = (categories || []).map((c: any) => ({ value: c.id, label: c.nombre }));

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initial ? {
      nombre: initial.nombre,
      descripcion: initial.descripcion || '',
      categoriaSuministro: initial.categoriaSuministro,
      categoryId: initial.categoryId || '',
      unidadMedida: initial.unidadMedida || 'unidad',
      stockActual: initial.stockActual,
      stockMinimo: initial.stockMinimo,
      costoUnitario: initial.costoUnitario,
      proveedor: initial.proveedor || '',
    } : { stockActual: 0, stockMinimo: 0, costoUnitario: 0, unidadMedida: 'unidad' },
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
        <span className="text-sm text-muted-foreground">{isEdit ? 'Editar' : 'Nuevo'} insumo</span>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Nombre</label>
        <Input {...register('nombre')} placeholder="Jabón líquido" />
        {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Descripción</label>
        <Input {...register('descripcion')} placeholder="Opcional" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Categoría</label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Select {...register('categoryId')} placeholder="Seleccionar categoría" options={catOpts} onChange={(e) => {
              const cat = (categories || []).find((c: any) => c.id === e.target.value);
              setValue('categoryId', e.target.value);
              setValue('categoriaSuministro', cat?.nombre || '');
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
        <input type="hidden" {...register('categoriaSuministro')} />
        {errors.categoriaSuministro && <p className="text-xs text-destructive">{errors.categoriaSuministro.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Unidad de Medida</label>
          <Select {...register('unidadMedida')} placeholder="Unidad" options={UNIDADES_MEDIDA} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Proveedor</label>
          <Input {...register('proveedor')} placeholder="Opcional" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Stock Actual</label>
          <Input type="number" {...register('stockActual')} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Stock Mínimo</label>
          <Input type="number" {...register('stockMinimo')} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Costo Unitario</label>
          <Input type="number" step="0.01" {...register('costoUnitario')} />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Guardando...' : isEdit ? 'Actualizar Insumo' : 'Crear Insumo'}
      </Button>
    </form>
  );
}
