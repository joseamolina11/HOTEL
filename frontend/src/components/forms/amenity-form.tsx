import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateAmenity, useUpdateAmenity } from '@/hooks/useAmenities';

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onSuccess: () => void;
  initial?: any;
}

export function AmenityForm({ onSuccess, initial }: Props) {
  const create = useCreateAmenity();
  const update = useUpdateAmenity();
  const isEdit = !!initial;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initial ? {
      nombre: initial.nombre,
      descripcion: initial.descripcion || '',
    } : {},
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
      <div className="space-y-2">
        <label className="text-sm font-medium">Nombre</label>
        <Input {...register('nombre')} placeholder="WiFi, Piscina, Gym..." />
        {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Descripción</label>
        <Input {...register('descripcion')} placeholder="Opcional" />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Guardando...' : isEdit ? 'Actualizar Beneficio' : 'Crear Beneficio'}
      </Button>
    </form>
  );
}
