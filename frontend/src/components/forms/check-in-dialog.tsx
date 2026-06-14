import { useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guestsApi } from '@/api/guests.api';
import { reservationsApi } from '@/api/reservations.api';
import apiClient from '@/api/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, X, UserPlus, LogIn, Loader2 } from 'lucide-react';
import { toastSuccess } from '@/lib/notifications';

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
  const [showNewGuest, setShowNewGuest] = useState(false);
  const [newGuest, setNewGuest] = useState({ nombres: '', apellidos: '', documento: '', nacionalidad: '', telefono: '' });

  const { register, handleSubmit, control, formState: { errors }, setValue, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fechaEntrada: today(), fechaSalida: tomorrow(), companions: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'companions' });

  const { data: guests } = useQuery({
    queryKey: ['guests', guestSearch],
    queryFn: () => guestsApi.findAll(guestSearch),
    enabled: guestSearch.length > 0,
  });

  const createGuestMut = useMutation({ mutationFn: (dto: any) => guestsApi.create(dto) });
  const createReservationMut = useMutation({
    mutationFn: (dto: any) => reservationsApi.create(dto),
  });
  const checkInMut = useMutation({
    mutationFn: ({ reservationId, data }: { reservationId: string; data: any }) =>
      apiClient.post('/check-in', { reservationId, ...data }),
  });

  const isProcessing = createGuestMut.isPending || createReservationMut.isPending || checkInMut.isPending;

  const handleGuestSelect = (guest: any) => {
    setSelectedGuest(guest);
    setStep('checkin');
  };

  const handleCreateAndSelect = async () => {
    const guest = await createGuestMut.mutateAsync(newGuest);
    setSelectedGuest(guest);
    setShowNewGuest(false);
    setStep('checkin');
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

    await checkInMut.mutateAsync({
      reservationId: reservation.id,
      data: {
        observaciones: data.observaciones,
        companions: companionsList.length > 0 ? companionsList : undefined,
      },
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

              {guestSearch && filteredGuests.length === 0 && !showNewGuest && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">No se encontraron huéspedes</p>
                  <Button variant="outline" size="sm" onClick={() => setShowNewGuest(true)}>
                    <UserPlus className="mr-1 h-3 w-3" /> Registrar nuevo
                  </Button>
                </div>
              )}

              {showNewGuest && (
                <div className="space-y-3 rounded-lg border p-4">
                  <p className="text-xs font-medium text-muted-foreground">Nuevo huésped</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Nombres" value={newGuest.nombres} onChange={(e) => setNewGuest({ ...newGuest, nombres: e.target.value })} />
                    <Input placeholder="Apellidos" value={newGuest.apellidos} onChange={(e) => setNewGuest({ ...newGuest, apellidos: e.target.value })} />
                    <Input placeholder="Documento" value={newGuest.documento} onChange={(e) => setNewGuest({ ...newGuest, documento: e.target.value })} />
                    <Input placeholder="Nacionalidad" value={newGuest.nacionalidad} onChange={(e) => setNewGuest({ ...newGuest, nacionalidad: e.target.value })} />
                    <Input placeholder="Teléfono" value={newGuest.telefono} onChange={(e) => setNewGuest({ ...newGuest, telefono: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowNewGuest(false)}>Cancelar</Button>
                    <Button size="sm" onClick={handleCreateAndSelect} disabled={!newGuest.nombres || !newGuest.apellidos || !newGuest.documento}>
                      Registrar y seleccionar
                    </Button>
                  </div>
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

              <Button type="submit" className="w-full" disabled={isProcessing}>
                {isProcessing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
                ) : (
                  <><LogIn className="mr-2 h-4 w-4" /> Completar Check-In</>
                )}
              </Button>
            </form>
          )}

          {step === 'guest' && !showNewGuest && !selectedGuest && guestSearch.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Busca un huésped existente o registra uno nuevo</p>
            </div>
          )}
        </div>
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
