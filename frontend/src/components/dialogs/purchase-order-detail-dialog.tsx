import { useQuery } from '@tanstack/react-query';
import { purchaseOrdersApi } from '@/api/purchase-orders.api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface Props {
  purchaseOrderId: string | null | undefined;
  open: boolean;
  onClose: () => void;
}

const statusColors: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  borrador: 'secondary',
  aprobada: 'default',
  recibida: 'outline',
  anulada: 'destructive',
};

export function PurchaseOrderDetailDialog({ purchaseOrderId, open, onClose }: Props) {
  const { data: po, isLoading } = useQuery({
    queryKey: ['purchase-order-detail', purchaseOrderId],
    queryFn: () => purchaseOrdersApi.findOne(purchaseOrderId!),
    enabled: !!purchaseOrderId && open,
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Orden de Compra {po?.codigo}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4">Cargando...</p>
        ) : po ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Proveedor</p>
                <p className="font-medium">{po.supplier?.razonSocial || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Estado</p>
                <Badge variant={statusColors[po.estado] || 'secondary'} className="capitalize">{po.estado}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Fecha</p>
                <p className="font-medium">{po.fecha}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Código</p>
                <p className="font-mono text-xs font-medium">{po.codigo}</p>
              </div>
            </div>
            {po.observaciones && (
              <div className="text-sm">
                <p className="text-muted-foreground">Observaciones</p>
                <p className="font-medium">{po.observaciones}</p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium mb-2">Productos / Servicios</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-1 text-left">Descripción</th>
                    <th className="px-2 py-1 text-right">Cant.</th>
                    <th className="px-2 py-1 text-right">P.Unit</th>
                    <th className="px-2 py-1 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(po.items || []).map((item: any, i: number) => (
                    <tr key={item.id || i} className="border-b">
                      <td className="px-2 py-1">{item.descripcion}</td>
                      <td className="px-2 py-1 text-right">{item.cantidad}</td>
                      <td className="px-2 py-1 text-right">{formatCurrency(item.precioUnitario)}</td>
                      <td className="px-2 py-1 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="px-2 py-2 text-right font-bold">Subtotal</td>
                    <td className="px-2 py-2 text-right">{formatCurrency(po.subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-2 py-1 text-right text-muted-foreground">Impuestos ({po.tasaImpuesto}%)</td>
                    <td className="px-2 py-1 text-right">{formatCurrency(po.impuestos)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-2 py-2 text-right font-bold text-base">Total</td>
                    <td className="px-2 py-2 text-right font-bold text-base">{formatCurrency(po.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4">Orden no encontrada</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
