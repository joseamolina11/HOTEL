import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { amenityApi } from '@/api/amenity.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateRoomType, useUpdateRoomType } from '@/hooks/useRoomTypes';
import { Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  capacidadAdultos: z.coerce.number().min(1, 'Capacidad inválida'),
  capacidadNinos: z.coerce.number().min(0, 'Capacidad inválida'),
  precioBase: z.coerce.number().min(0, 'Precio inválido'),
  colorIdentificador: z.string().optional().default('#3b82f6'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onSuccess: () => void;
  initial?: any;
}

export function RoomTypeForm({ onSuccess, initial }: Props) {
  const create = useCreateRoomType();
  const update = useUpdateRoomType();
  const isEdit = !!initial;

  const { data: amenitiesResponse } = useQuery({
    queryKey: ['amenities'],
    queryFn: () => amenityApi.findAll(),
  });

  const amenities = amenitiesResponse?.data?.data || [];

  const initialAmenityIds: string[] = initial?.amenities?.map((a: any) => a.id) || [];
  const [selectedIds, setSelectedIds] = useState<string[]>(initialAmenityIds);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initial ? {
      nombre: initial.nombre,
      descripcion: initial.descripcion || '',
      capacidadAdultos: initial.capacidadAdultos,
      capacidadNinos: initial.capacidadNinos,
      precioBase: initial.precioBase,
      colorIdentificador: initial.colorIdentificador || '#3b82f6',
    } : { capacidadAdultos: 2, capacidadNinos: 0, colorIdentificador: '#3b82f6' },
  });

  const toggleAmenity = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const onSubmit = async (data: FormData) => {
    const payload = { ...data, amenityIds: selectedIds };
    if (isEdit) {
      await update.mutateAsync({ id: initial.id, dto: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onSuccess();
  };

  const isPending = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Nombre</label>
        <Input {...register('nombre')} placeholder="Suite Presidencial" />
        {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Descripción</label>
        <Input {...register('descripcion')} placeholder="Opcional" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Capacidad Adultos</label>
          <Input type="number" {...register('capacidadAdultos')} />
          {errors.capacidadAdultos && <p className="text-xs text-destructive">{errors.capacidadAdultos.message}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Capacidad Niños</label>
          <Input type="number" {...register('capacidadNinos')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Precio Base</label>
          <Input type="number" step="0.01" {...register('precioBase')} />
          {errors.precioBase && <p className="text-xs text-destructive">{errors.precioBase.message}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Color</label>
          <Input type="color" {...register('colorIdentificador')} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Amenidades incluidas</label>
        {!amenities || amenities.length === 0 ? (
          <p className="text-xs text-muted-foreground">No hay amenidades disponibles. Créalas primero en el módulo de Amenidades.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {amenities.map((a: any) => (
              <button
                key={a.id}
                type="button"
                onClick={() => toggleAmenity(a.id)}
                className={cn(
                  'flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                  selectedIds.includes(a.id)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-input hover:border-primary/50',
                )}
              >
                <div className={cn(
                  'flex h-4 w-4 items-center justify-center rounded-sm border transition-colors',
                  selectedIds.includes(a.id) ? 'bg-primary border-primary' : 'border-input',
                )}>
                  {selectedIds.includes(a.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
                <span>{a.nombre}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Guardando...' : isEdit ? 'Actualizar Tipo' : 'Crear Tipo'}
      </Button>
    </form>
  );
}
