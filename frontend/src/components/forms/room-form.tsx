import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { roomTypesApi } from '@/api/room-types.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useCreateRoom } from '@/hooks/useRooms';

const roomSchema = z.object({
  numero: z.string().min(1, 'Número requerido'),
  nombre: z.string().min(1, 'Nombre requerido'),
  roomTypeId: z.string().min(1, 'Selecciona un tipo'),
  piso: z.coerce.number().min(0, 'Piso inválido'),
  observaciones: z.string().optional(),
});

type RoomFormData = z.infer<typeof roomSchema>;

interface RoomFormProps {
  onSuccess: () => void;
}

export function RoomForm({ onSuccess }: RoomFormProps) {
  const createRoom = useCreateRoom();
  const { data: roomTypesResponse } = useQuery({ queryKey: ['room-types'], queryFn: () => roomTypesApi.findAll() });

  const roomTypes = roomTypesResponse?.data?.data || [];

  const { register, handleSubmit, formState: { errors } } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: { piso: 1 },
  });

  const onSubmit = async (data: RoomFormData) => {
    await createRoom.mutateAsync(data);
    onSuccess();
  };

  const typeOpts = (roomTypes || []).map((rt: any) => ({ value: rt.id, label: rt.nombre }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Número</label>
          <Input {...register('numero')} placeholder="101" />
          {errors.numero && <p className="text-xs text-destructive">{errors.numero.message}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Piso</label>
          <Input type="number" {...register('piso')} placeholder="1" />
          {errors.piso && <p className="text-xs text-destructive">{errors.piso.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Nombre</label>
        <Input {...register('nombre')} placeholder="Habitación 101" />
        {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Tipo de Habitación</label>
        <Select {...register('roomTypeId')} placeholder="Seleccionar tipo" options={typeOpts} />
        {errors.roomTypeId && <p className="text-xs text-destructive">{errors.roomTypeId.message}</p>}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Observaciones</label>
        <Input {...register('observaciones')} placeholder="Opcional" />
      </div>
      <Button type="submit" className="w-full" disabled={createRoom.isPending}>
        {createRoom.isPending ? 'Creando...' : 'Crear Habitación'}
      </Button>
    </form>
  );
}
