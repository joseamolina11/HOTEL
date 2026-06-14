import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

const companionSchema = z.object({
  nombres: z.string().min(1, 'Nombre requerido'),
  apellidos: z.string().min(1, 'Apellido requerido'),
  documento: z.string().min(1, 'Doc. requerido'),
  nacionalidad: z.string().min(1, 'Nac. requerida'),
});

const checkInSchema = z.object({
  reservationId: z.string().min(1),
  observaciones: z.string().optional(),
  companions: z.array(companionSchema).optional().default([]),
});

type CheckInFormData = z.infer<typeof checkInSchema>;

interface CheckInFormProps {
  reservationId: string;
  onSuccess: () => void;
}

export function CheckInForm({ reservationId, onSuccess }: CheckInFormProps) {
  const qc = useQueryClient();
  const { register, handleSubmit, control, formState: { errors } } = useForm<CheckInFormData>({
    resolver: zodResolver(checkInSchema),
    defaultValues: { reservationId, companions: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'companions' });

  const mutation = useMutation({
    mutationFn: (data: CheckInFormData) => apiClient.post('/check-in', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
      onSuccess();
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutateAsync(data))} className="space-y-4">
      <input type="hidden" {...register('reservationId')} />

      <div className="space-y-2">
        <label className="text-sm font-medium">Observaciones</label>
        <Input {...register('observaciones')} placeholder="Opcional" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Acompañantes</label>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ nombres: '', apellidos: '', documento: '', nacionalidad: '' })}>
            <Plus className="mr-1 h-3 w-3" /> Agregar
          </Button>
        </div>
        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-5 gap-2 rounded-lg border p-2">
            <Input {...register(`companions.${index}.nombres`)} placeholder="Nombres" />
            <Input {...register(`companions.${index}.apellidos`)} placeholder="Apellidos" />
            <Input {...register(`companions.${index}.documento`)} placeholder="Documento" />
            <Input {...register(`companions.${index}.nacionalidad`)} placeholder="Nacionalidad" />
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? 'Procesando...' : 'Confirmar Check-In'}
      </Button>
    </form>
  );
}
