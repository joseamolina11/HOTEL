import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, X } from 'lucide-react';
import { useOpenNewCashRegister } from '@/hooks/useCashRegister';
import { useAuthStore } from '@/stores/auth.store';
import { toastSuccess } from '@/lib/notifications';

export function OpenCashRegisterDialog({
  open,
  onClose,
  dismissible = true,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  dismissible?: boolean;
  onSuccess?: () => void;
}) {
  const [montoInicial, setMontoInicial] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const openMut = useOpenNewCashRegister();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const canOpen = isAdmin || (user?.permissions ?? []).includes('cash-register:open');

  if (!open) return null;

  const handleSubmit = async () => {
    await openMut.mutateAsync({
      montoInicial: Number(montoInicial),
      observaciones: observaciones || undefined,
    });
    toastSuccess('Caja abierta');
    setMontoInicial('');
    setObservaciones('');
    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Abrir Caja</h2>
          {dismissible && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {!canOpen ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">
              No hay una caja abierta y no se puede hacer transacciones hasta que se abra una.
            </p>
            <p className="text-sm text-muted-foreground">
              No tienes permiso para abrir caja. Contacta a un administrador o a un usuario con el
              permiso de «Abrir caja».
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Monto Inicial (Caja Menor)</label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={montoInicial}
                onChange={(e) => setMontoInicial(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Observaciones</label>
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <Button
              className="w-full"
              disabled={!montoInicial || openMut.isPending}
              onClick={handleSubmit}
            >
              {openMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Abrir Caja
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
