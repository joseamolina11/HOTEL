import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { roomsApi } from '@/api/rooms.api';
import { roomTypesApi } from '@/api/room-types.api';
import { paymentMethodsApi } from '@/api/payment-methods.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useCreateReservation } from '@/hooks/useReservations';
import { Plus, X, BedDouble, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { GuestSearch } from '@/components/forms/guest-search';

const companionSchema = z.object({
  nombres: z.string().min(1, 'Nombre requerido'),
  apellidos: z.string().min(1, 'Apellidos requerido'),
  documento: z.string().min(1, 'Doc. requerido'),
  nacionalidad: z.string().min(1, 'Nac. requerida'),
  telefono: z.string().optional(),
  email: z.string().optional(),
});

const reservationSchema = z.object({
  guestId: z.string().min(1, 'Selecciona un huésped'),
  roomId: z.string().min(1, 'Selecciona una habitación'),
  fechaEntrada: z.string().min(1, 'Fecha de entrada requerida'),
  fechaSalida: z.string().min(1, 'Fecha de salida requerida'),
  cantidadHuespedes: z.coerce.number().min(1, 'Mínimo 1 huésped'),
  observaciones: z.string().optional(),
  companions: z.array(companionSchema).optional().default([]),
  pagoMonto: z.coerce.number().min(0).optional(),
  pagoMetodoPagoId: z.string().optional(),
  pagoReferencia: z.string().optional(),
});

type ReservationFormData = z.infer<typeof reservationSchema>;

interface ReservationFormProps {
  onSuccess: () => void;
  defaultRoomId?: string;
  defaultDate?: string;
}

export function ReservationForm({ onSuccess, defaultRoomId, defaultDate }: ReservationFormProps) {
  const createReservation = useCreateReservation();

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: { cantidadHuespedes: 1, companions: [], roomId: defaultRoomId || '', fechaEntrada: defaultDate || '' },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'companions' });

  const fechaEntrada = watch('fechaEntrada');
  const fechaSalida = watch('fechaSalida');

  const { data: availableRooms } = useQuery({
    queryKey: ['rooms', 'available', fechaEntrada, fechaSalida],
    queryFn: () => roomsApi.findAvailable(fechaEntrada, fechaSalida),
    enabled: !!fechaEntrada && !!fechaSalida,
  });

  const { data: availability } = useQuery({
    queryKey: ['room-types', 'availability', fechaEntrada, fechaSalida],
    queryFn: () => roomTypesApi.getAvailability(fechaEntrada, fechaSalida),
    enabled: !!fechaEntrada && !!fechaSalida,
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods-active'],
    queryFn: () => paymentMethodsApi.findAllActive(),
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => roomsApi.findAll(),
  });

  const defaultRoom = defaultRoomId && rooms
    ? rooms.find((r: any) => r.id === defaultRoomId)
    : null;

  const onSubmit = async (data: ReservationFormData) => {
    const payload: any = { ...data, estado: 'confirmada' };
    if (data.pagoMonto && data.pagoMonto > 0) {
      payload.pagoMonto = data.pagoMonto;
      payload.pagoMetodoPagoId = data.pagoMetodoPagoId || undefined;
      payload.pagoReferencia = data.pagoReferencia || undefined;
    }
    await createReservation.mutateAsync(payload);
    onSuccess();
  };

  const roomOpts = (availableRooms || rooms || []).map((r: any) => ({
    value: r.id,
    label: `${r.numero} — ${r.nombre} (${r.roomType?.nombre || 'N/A'})`,
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {defaultRoom && (
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <BedDouble className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-semibold">{defaultRoom.numero} — {defaultRoom.nombre}</p>
              <p className="text-xs text-muted-foreground">
                {defaultRoom.roomType?.nombre} — {formatCurrency(defaultRoom.roomType?.precioBase || 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Huésped</label>
        <GuestSearch onSelect={(id) => setValue('guestId', id)} />
        {errors.guestId && <p className="text-xs text-destructive">{errors.guestId.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Entrada</label>
          <Input type="date" {...register('fechaEntrada')} />
          {errors.fechaEntrada && <p className="text-xs text-destructive">{errors.fechaEntrada.message}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Salida</label>
          <Input type="date" {...register('fechaSalida')} />
          {errors.fechaSalida && <p className="text-xs text-destructive">{errors.fechaSalida.message}</p>}
        </div>
      </div>

      {availability && availability.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Disponibilidad por Tipo de Habitación</label>
          <div className="grid grid-cols-2 gap-2">
            {availability.map((rt: any) => (
              <div
                key={rt.id}
                className="flex items-center justify-between rounded-lg border p-3 text-sm"
                style={{ borderLeftColor: rt.colorIdentificador, borderLeftWidth: 4 }}
              >
                <div>
                  <p className="font-medium">{rt.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    Cap. {rt.capacidadAdultos} adulto(s) + {rt.capacidadNinos} niño(s)
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {rt.availableRooms}/{rt.totalRooms}
                  </p>
                  <p className="text-xs">{formatCurrency(rt.precioBase)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Habitación</label>
        <Select {...register('roomId')} placeholder={fechaEntrada && fechaSalida ? 'Seleccionar habitación disponible' : 'Primero selecciona fechas'} options={roomOpts} />
        {errors.roomId && <p className="text-xs text-destructive">{errors.roomId.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Cantidad de Huéspedes</label>
        <Input type="number" min={1} {...register('cantidadHuespedes')} />
        {errors.cantidadHuespedes && <p className="text-xs text-destructive">{errors.cantidadHuespedes.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Observaciones</label>
        <Input {...register('observaciones')} placeholder="Opcional" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Acompañantes</label>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ nombres: '', apellidos: '', documento: '', nacionalidad: '', telefono: '', email: '' })}>
            <Plus className="mr-1 h-3 w-3" /> Agregar
          </Button>
        </div>
        {fields.map((field, index) => (
          <div key={field.id} className="space-y-2 rounded-lg border p-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Input {...register(`companions.${index}.nombres`)} placeholder="Nombres" />
              <Input {...register(`companions.${index}.apellidos`)} placeholder="Apellidos" />
              <Input {...register(`companions.${index}.documento`)} placeholder="Documento" />
              <Input {...register(`companions.${index}.nacionalidad`)} placeholder="Nacionalidad" />
              <Input {...register(`companions.${index}.telefono`)} placeholder="Teléfono" />
              <div className="flex gap-1">
                <Input {...register(`companions.${index}.email`)} placeholder="Email" className="flex-1" />
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <DollarSign className="h-4 w-4" />
            Anticipo (opcional)
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-xs">Monto</label>
              <Input type="number" min={0} placeholder="0" {...register('pagoMonto')} />
            </div>
            <div className="space-y-1">
              <label className="text-xs">Método de pago</label>
              <Select {...register('pagoMetodoPagoId')} placeholder="Seleccionar" options={(paymentMethods || []).map((pm: any) => ({ value: pm.id, label: pm.nombre }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs">Referencia</label>
              <Input placeholder="Opcional" {...register('pagoReferencia')} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={createReservation.isPending}>
        {createReservation.isPending ? 'Creando...' : 'Crear Reserva'}
      </Button>
    </form>
  );
}
