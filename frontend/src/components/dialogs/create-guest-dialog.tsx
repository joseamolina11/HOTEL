import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { guestsApi } from '@/api/guests.api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, User, FileText, Globe, Phone, Mail, Calendar, MessageSquare } from 'lucide-react';

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

type FormData = z.infer<typeof guestSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (guest: any) => void;
}

export function CreateGuestDialog({ open, onClose, onSuccess }: Props) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(guestSchema),
    defaultValues: { nacionalidad: 'Colombiano(a)' },
  });

  const createMut = useMutation({
    mutationFn: (dto: FormData) => guestsApi.create(dto),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['guests'] });
      reset({ nacionalidad: 'Colombiano(a)' });
      onSuccess(data);
      onClose();
    },
  });

  const onSubmit = (data: FormData) => {
    createMut.mutate(data);
  };

  const handleClose = () => {
    if (createMut.isPending) return;
    reset({ nacionalidad: 'Colombiano(a)' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Nuevo Cliente
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium flex items-center gap-1">
                <User className="h-3 w-3 text-muted-foreground" /> Nombres <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" {...register('nombres')} placeholder="Juan Carlos" />
              </div>
              {errors.nombres && <p className="text-xs text-destructive">{errors.nombres.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium flex items-center gap-1">
                <User className="h-3 w-3 text-muted-foreground" /> Apellidos <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" {...register('apellidos')} placeholder="Pérez García" />
              </div>
              {errors.apellidos && <p className="text-xs text-destructive">{errors.apellidos.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium flex items-center gap-1">
                <FileText className="h-3 w-3 text-muted-foreground" /> Documento <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" {...register('documento')} placeholder="C.C. / Pasaporte" />
              </div>
              {errors.documento && <p className="text-xs text-destructive">{errors.documento.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium flex items-center gap-1">
                <Globe className="h-3 w-3 text-muted-foreground" /> Nacionalidad <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" {...register('nacionalidad')} placeholder="Colombiano(a)" />
              </div>
              {errors.nacionalidad && <p className="text-xs text-destructive">{errors.nacionalidad.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium flex items-center gap-1">
                <Phone className="h-3 w-3 text-muted-foreground" /> Teléfono <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" type="tel" {...register('telefono')} placeholder="+57 300 123 4567" />
              </div>
              {errors.telefono && <p className="text-xs text-destructive">{errors.telefono.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium flex items-center gap-1">
                <Mail className="h-3 w-3 text-muted-foreground" /> Email
              </label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" type="email" {...register('email')} placeholder="correo@ejemplo.com" />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" /> Fecha de Nacimiento
              </label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" type="date" {...register('fechaNacimiento')} />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium flex items-center gap-1">
              <MessageSquare className="h-3 w-3 text-muted-foreground" /> Observaciones
            </label>
            <Input {...register('observaciones')} placeholder="Notas adicionales (opcional)" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose} disabled={createMut.isPending}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={createMut.isPending}>
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <User className="h-4 w-4 mr-1" />}
              {createMut.isPending ? 'Creando...' : 'Crear Cliente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}