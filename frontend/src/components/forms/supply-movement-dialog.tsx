import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateSupplyMovement } from '@/hooks/useSupplies';
import { expensesApi } from '@/api/expenses.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

const movementSchema = z.object({
  tipo: z.enum(['entrada', 'salida', 'ajuste']),
  cantidad: z.coerce.number().min(1, 'Cantidad debe ser mayor a 0'),
  precioUnitario: z.coerce.number().min(0, 'Precio inválido').optional(),
  observaciones: z.string().optional(),
});

type FormData = z.infer<typeof movementSchema>;

interface Props {
  item: { id: string; nombre: string; costoUnitario: number } | null;
  onClose: () => void;
}

export function SupplyMovementDialog({ item, onClose }: Props) {
  const createMovement = useCreateSupplyMovement();
  const [expenseId, setExpenseId] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: { tipo: 'entrada', cantidad: 1, precioUnitario: item?.costoUnitario || 0 },
  });

  const tipo = watch('tipo');

  const onSubmit = async (data: FormData) => {
    if (!item) return;
    await createMovement.mutateAsync({
      supplyItemId: item.id,
      tipo: data.tipo,
      cantidad: data.cantidad,
      precioUnitario: data.precioUnitario || undefined,
      observaciones: data.observaciones || undefined,
      expenseId: expenseId || undefined,
    });
    onClose();
  };

  return (
    <Dialog open={!!item} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Movimiento — {item?.nombre}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo</label>
            <Select {...register('tipo')} options={[
              { value: 'entrada', label: 'Entrada' },
              { value: 'salida', label: 'Salida' },
              { value: 'ajuste', label: 'Ajuste' },
            ]} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Cantidad</label>
            <Input type="number" min={1} {...register('cantidad')} />
            {errors.cantidad && <p className="text-xs text-destructive">{errors.cantidad.message}</p>}
          </div>
          {tipo === 'entrada' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Costo unitario (entrada)</label>
                <Input type="number" step="0.01" min={0} {...register('precioUnitario')} />
                <p className="text-xs text-muted-foreground">Costo al que ingresó este insumo</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Egreso asociado</label>
                <SearchableSelect
                  value={expenseId}
                  onChange={(val) => setExpenseId(val)}
                  searchFn={expensesApi.search}
                  placeholder="Buscar egreso..."
                  searchPlaceholder="Escribe código o concepto..."
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Observaciones</label>
            <Input {...register('observaciones')} placeholder="Opcional" />
          </div>
          <Button type="submit" className="w-full" disabled={createMovement.isPending}>
            {createMovement.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Registrar Movimiento
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
