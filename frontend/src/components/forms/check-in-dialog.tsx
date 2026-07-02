import { useState, useCallback, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guestsApi } from '@/api/guests.api';
import { reservationsApi } from '@/api/reservations.api';
import { hotelConfigApi } from '@/api/hotel-config.api';
import { paymentMethodsApi } from '@/api/payment-methods.api';
import apiClient from '@/api/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, X, UserPlus, LogIn, Loader2, Printer, DollarSign } from 'lucide-react';
import { CreateGuestDialog } from '@/components/dialogs/create-guest-dialog';
import { toastSuccess } from '@/lib/notifications';
import { formatCurrency } from '@/lib/utils';
import { renderContract, printContract } from '@/lib/print-contract';

const today = () => new Date().toISOString().slice(0, 10);
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

const companionSchema = z.object({
  nombres: z.string().min(1, 'Requerido'),
  apellidos: z.string().min(1, 'Requerido'),
  documento: z.string().min(1, 'Requerido'),
  nacionalidad: z.string().min(1, 'Requerido'),
  telefono: z.string().optional(),
  email: z.string().optional(),
});

const schema = z.object({
  fechaEntrada: z.string().min(1, 'Requerida'),
  fechaSalida: z.string().min(1, 'Requerida'),
  observaciones: z.string().optional(),
  companions: z.array(companionSchema).default([]),
});

type FormData = z.infer<typeof schema>;

interface CheckInDialogProps {
  room: any;
  open: boolean;
  onClose: () => void;
}

export function CheckInDialog({ room, open, onClose }: CheckInDialogProps) {
  const qc = useQueryClient();
  const [step, setStep] = useState<'guest' | 'checkin'>(room ? 'guest' : 'guest');
  const [guestSearch, setGuestSearch] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [showCreateGuest, setShowCreateGuest] = useState(false);

  const [pagoMonto, setPagoMonto] = useState(0);
  const [pagoMetodoPagoId, setPagoMetodoPagoId] = useState('');
  const [pagoReferencia, setPagoReferencia] = useState('');

  const { register, handleSubmit, control, formState: { errors }, setValue, getValues, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fechaEntrada: today(), fechaSalida: tomorrow(), companions: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'companions' });

  const watchedEntrada = watch('fechaEntrada');
  const watchedSalida = watch('fechaSalida');

  const estimatedTotal = useMemo(() => {
    if (!room?.roomType?.precioBase || !watchedEntrada || !watchedSalida) return 0;
    const noches = Math.ceil(
      (new Date(watchedSalida).getTime() - new Date(watchedEntrada).getTime()) / (1000 * 60 * 60 * 24),
    );
    return noches * Number(room.roomType.precioBase);
  }, [room, watchedEntrada, watchedSalida]);

  const { data: hotelConfig } = useQuery({
    queryKey: ['hotel-config'],
    queryFn: () => hotelConfigApi.getConfig(),
  });

  const { data: guests } = useQuery({
    queryKey: ['guests', guestSearch],
    queryFn: () => guestsApi.findAll(guestSearch),
    enabled: guestSearch.length > 0,
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods-active'],
    queryFn: () => paymentMethodsApi.findAllActive(),
  });

  const createReservationMut = useMutation({
    mutationFn: (dto: any) => reservationsApi.create(dto),
  });
  const checkInMut = useMutation({
    mutationFn: ({ reservationId, data }: { reservationId: string; data: any }) =>
      apiClient.post('/check-in', { reservationId, ...data }),
  });

  const isProcessing = createReservationMut.isPending || checkInMut.isPending;

  const handleGuestSelect = (guest: any) => {
    setSelectedGuest(guest);
    setStep('checkin');
  };

  const handlePrintContract = () => {
    if (!selectedGuest || !hotelConfig?.contratoHtml) return;
    const formData = getValues();
    const html = renderContract(hotelConfig.contratoHtml, {
      guest: {
        nombres: selectedGuest.nombres,
        apellidos: selectedGuest.apellidos,
        documento: selectedGuest.documento,
        nacionalidad: selectedGuest.nacionalidad,
        telefono: selectedGuest.telefono,
        email: selectedGuest.email,
      },
      room: {
        numero: room.numero,
        nombre: room.nombre,
        tipoHabitacion: room.roomType?.nombre || '',
        precioBase: room.roomType?.precioBase,
      },
      hotel: {
        nombre: hotelConfig.nombre,
        direccion: hotelConfig.direccion,
        ciudad: hotelConfig.ciudad,
        pais: hotelConfig.pais,
        telefono: hotelConfig.telefono,
        email: hotelConfig.email,
        logo: hotelConfig.logo,
      },
      fechaEntrada: formData.fechaEntrada,
      fechaSalida: formData.fechaSalida,
      cantidadHuespedes: 1 + (formData.companions?.filter((c: any) => c.documento).length || 0),
      huespedesLista: (formData.companions || [])
        .filter((c: any) => c.documento)
        .map((c: any) => `${c.nombres} ${c.apellidos} (${c.documento})`).join(', '),
    });
    printContract(html);
  };

  const onSubmit = async (data: FormData) => {
    let guestId = selectedGuest?.id;
    if (!guestId) return;

    const companionsList = data.companions.filter((c) => c.documento);

    const reservation = await createReservationMut.mutateAsync({
      roomId: room.id,
      guestId,
      fechaEntrada: data.fechaEntrada,
      fechaSalida: data.fechaSalida,
      cantidadHuespedes: 1 + companionsList.length,
      observaciones: data.observaciones,
      estado: 'confirmada',
      companions: companionsList.length > 0 ? companionsList : undefined,
    });

    const paymentData: any = {
      observaciones: data.observaciones,
      companions: companionsList.length > 0 ? companionsList : undefined,
    };
    if (pagoMonto > 0 && pagoMetodoPagoId) {
      paymentData.pagoMonto = pagoMonto;
      paymentData.pagoMetodoPagoId = pagoMetodoPagoId;
      if (pagoReferencia) paymentData.pagoReferencia = pagoReferencia;
    }
    await checkInMut.mutateAsync({
      reservationId: reservation.id,
      data: paymentData,
    });

    toastSuccess('Check-In realizado correctamente');
    qc.invalidateQueries({ queryKey: ['rooms'] });
    qc.invalidateQueries({ queryKey: ['reservations'] });
    qc.invalidateQueries({ queryKey: ['guests'] });
    onClose();
  };

  if (!room) return null;

  const guestsList = guests?.data?.data || [];
  const filteredGuests = (guestsList || []).filter((g: any) =>
    !selectedGuest || g.id !== selectedGuest.id,
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" /> Check-In — {room.numero} {room.nombre}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Habitación</span>
              <span className="font-medium">{room.numero} — {room.nombre}</span>
            </div>
            {room.roomType && (
              <div className="flex justify-between mt-1">
                <span className="text-muted-foreground">Tipo</span>
                <span>{room.roomType.nombre}</span>
              </div>
            )}
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">Piso</span>
              <span>{room.piso}</span>
            </div>
          </div>

          {step === 'guest' && (
            <div className="space-y-4">
              <label className="text-sm font-medium">Huésped principal</label>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-10" placeholder="Buscar por nombre o documento..." value={guestSearch} onChange={(e) => setGuestSearch(e.target.value)} />
              </div>

              {guestSearch && filteredGuests.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-lg border">
                  {filteredGuests.slice(0, 8).map((g: any) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => handleGuestSelect(g)}
                      className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent border-b last:border-0"
                    >
                      <span className="font-medium">{g.nombres} {g.apellidos}</span>
                      <span className="text-muted-foreground">{g.documento}</span>
                    </button>
                  ))}
                </div>
              )}

              {guestSearch && filteredGuests.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">No se encontraron huéspedes</p>
                  <Button variant="outline" size="sm" onClick={() => setShowCreateGuest(true)}>
                    <UserPlus className="mr-1 h-3 w-3" /> Crear nuevo cliente
                  </Button>
                </div>
              )}

              {selectedGuest && step === 'guest' && (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{selectedGuest.nombres} {selectedGuest.apellidos}</p>
                    <p className="text-xs text-muted-foreground">{selectedGuest.documento} • {selectedGuest.nacionalidad}</p>
                  </div>
                  <Button size="sm" onClick={() => setStep('checkin')}>Continuar</Button>
                </div>
              )}
            </div>
          )}

          {step === 'checkin' && selectedGuest && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm font-medium">{selectedGuest.nombres} {selectedGuest.apellidos}</p>
                <p className="text-xs text-muted-foreground">{selectedGuest.documento} • {selectedGuest.nacionalidad}</p>
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Acompañantes</label>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ nombres: '', apellidos: '', documento: '', nacionalidad: '', telefono: '', email: '' })}>
                    <Plus className="mr-1 h-3 w-3" /> Agregar
                  </Button>
                </div>
                {fields.map((field, index) => (
                  <CompanionRow
                    key={field.id}
                    index={index}
                    register={register}
                    errors={errors}
                    setValue={setValue}
                    getValues={getValues}
                    onRemove={() => remove(index)}
                  />
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Observaciones</label>
                <Input {...register('observaciones')} placeholder="Opcional" />
              </div>

              <div className="rounded-lg border border-amber-200 p-3 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
                  <DollarSign className="h-4 w-4" /> Pago en entrada
                </div>
                <p className="text-xs text-muted-foreground">
                  Total estimado: {formatCurrency(estimatedTotal)} &mdash; Puedes cobrar el total, la mitad o un valor personalizado
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs text-muted-foreground">Monto a cobrar</label>
                    <Input
                      type="number" step="0.01" min={0}
                      placeholder="0.00"
                      value={pagoMonto || ''}
                      onChange={(e) => setPagoMonto(Number(e.target.value))}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs text-muted-foreground">Método de pago</label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      value={pagoMetodoPagoId}
                      onChange={(e) => setPagoMetodoPagoId(e.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      {(paymentMethods || []).map((pm: any) => (
                        <option key={pm.id} value={pm.id}>{pm.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs text-muted-foreground">Referencia</label>
                    <Input
                      placeholder="Opcional"
                      value={pagoReferencia}
                      onChange={(e) => setPagoReferencia(e.target.value)}
                    />
                  </div>
                </div>
                {pagoMonto > 0 && (
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => { setPagoMonto(estimatedTotal); setPagoMetodoPagoId(pagoMetodoPagoId); }}>
                      Total ({formatCurrency(estimatedTotal)})
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => { setPagoMonto(estimatedTotal / 2); setPagoMetodoPagoId(pagoMetodoPagoId); }}>
                      Mitad ({formatCurrency(estimatedTotal / 2)})
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {hotelConfig?.contratoHtml && (
                  <Button type="button" variant="outline" size="sm" onClick={handlePrintContract} className="flex-1">
                    <Printer className="mr-2 h-4 w-4" /> Imprimir Contrato
                  </Button>
                )}
                <Button type="submit" className="flex-1" disabled={isProcessing}>
                  {isProcessing ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
                  ) : (
                    <><LogIn className="mr-2 h-4 w-4" /> Completar Check-In</>
                  )}
                </Button>
              </div>
            </form>
          )}

          {step === 'guest' && !selectedGuest && guestSearch.length === 0 && (
            <div className="text-center py-8 text-muted-foreground space-y-3">
              <p className="text-sm">Busca un huésped existente o registra uno nuevo</p>
              <Button variant="outline" size="sm" onClick={() => setShowCreateGuest(true)}>
                <UserPlus className="mr-1 h-3 w-3" /> Crear nuevo cliente
              </Button>
            </div>
          )}
        </div>

        <CreateGuestDialog
          open={showCreateGuest}
          onClose={() => setShowCreateGuest(false)}
          onSuccess={(guest) => {
            setSelectedGuest(guest);
            setShowCreateGuest(false);
            setStep('checkin');
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function CompanionRow({
  index,
  register,
  errors,
  setValue,
  getValues,
  onRemove,
}: {
  index: number;
  register: any;
  errors: any;
  setValue: any;
  getValues: any;
  onRemove: () => void;
}) {
  const [searching, setSearching] = useState(false);

  const handleDocBlur = useCallback(async () => {
    const doc = getValues(`companions.${index}.documento`);
    if (!doc || doc.length < 3) return;
    setSearching(true);
    try {
      const existing = (await guestsApi.findAll(doc))?.data?.data || [];
      if (existing.length > 0) {
        const g = existing[0];
        setValue(`companions.${index}.nombres`, g.nombres);
        setValue(`companions.${index}.apellidos`, g.apellidos);
        setValue(`companions.${index}.nacionalidad`, g.nacionalidad);
        if (g.telefono) setValue(`companions.${index}.telefono`, g.telefono);
        if (g.email) setValue(`companions.${index}.email`, g.email || '');
      }
    } finally {
      setSearching(false);
    }
  }, [index, getValues, setValue]);

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Acompañante #{index + 1}</span>
        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Nombres</label>
          <Input {...register(`companions.${index}.nombres`)} placeholder="Nombres" />
          {errors.companions?.[index]?.nombres && <p className="text-xs text-destructive">{errors.companions[index].nombres.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Apellidos</label>
          <Input {...register(`companions.${index}.apellidos`)} placeholder="Apellidos" />
          {errors.companions?.[index]?.apellidos && <p className="text-xs text-destructive">{errors.companions[index].apellidos.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Documento</label>
          <div className="relative">
            <Input
              {...register(`companions.${index}.documento`)}
              placeholder="Cédula / Pasaporte"
              onBlur={handleDocBlur}
            />
            {searching && <Loader2 className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-muted-foreground" />}
          </div>
          {errors.companions?.[index]?.documento && <p className="text-xs text-destructive">{errors.companions[index].documento.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Nacionalidad</label>
          <Input {...register(`companions.${index}.nacionalidad`)} placeholder="Nacionalidad" />
          {errors.companions?.[index]?.nacionalidad && <p className="text-xs text-destructive">{errors.companions[index].nacionalidad.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Teléfono</label>
          <Input {...register(`companions.${index}.telefono`)} placeholder="Teléfono" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Email</label>
          <Input {...register(`companions.${index}.email`)} placeholder="Email" />
        </div>
      </div>
    </div>
  );
}
