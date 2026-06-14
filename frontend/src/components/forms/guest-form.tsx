import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateGuest } from '@/hooks/useGuests';

const guestSchema = z.object({
  nombres: z.string().min(1, 'Nombre requerido'),
  apellidos: z.string().min(1, 'Apellidos requeridos'),
  documento: z.string().min(1, 'Documento requerido'),
  nacionalidad: z.string().min(1, 'Nacionalidad requerida'),
  telefono: z.string().min(7, 'Teléfono inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  fechaNacimiento: z.string().optional(),
  observaciones: z.string().optional(),
});

type GuestFormData = z.infer<typeof guestSchema>;

interface GuestFormProps {
  onSuccess: () => void;
}

export function GuestForm({ onSuccess }: GuestFormProps) {
  const createGuest = useCreateGuest();
  const { register, handleSubmit, formState: { errors } } = useForm<GuestFormData>({
    resolver: zodResolver(guestSchema),
  });

  const onSubmit = async (data: GuestFormData) => {
    await createGuest.mutateAsync(data);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Nombres</label>
          <Input {...register('nombres')} placeholder="Juan Carlos" />
          {errors.nombres && <p className="text-xs text-destructive">{errors.nombres.message}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Apellidos</label>
          <Input {...register('apellidos')} placeholder="Pérez García" />
          {errors.apellidos && <p className="text-xs text-destructive">{errors.apellidos.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Documento</label>
          <Input {...register('documento')} placeholder="PAS123456" />
          {errors.documento && <p className="text-xs text-destructive">{errors.documento.message}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Nacionalidad</label>
          <Input {...register('nacionalidad')} placeholder="Mexicana" />
          {errors.nacionalidad && <p className="text-xs text-destructive">{errors.nacionalidad.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Teléfono</label>
          <Input {...register('telefono')} placeholder="+52 998 123 4567" />
          {errors.telefono && <p className="text-xs text-destructive">{errors.telefono.message}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input type="email" {...register('email')} placeholder="juan@email.com" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Fecha de Nacimiento</label>
        <Input type="date" {...register('fechaNacimiento')} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Observaciones</label>
        <Input {...register('observaciones')} placeholder="Opcional" />
      </div>
      <Button type="submit" className="w-full" disabled={createGuest.isPending}>
        {createGuest.isPending ? 'Creando...' : 'Crear Huésped'}
      </Button>
    </form>
  );
}
