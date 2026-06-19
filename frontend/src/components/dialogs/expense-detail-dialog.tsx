import { useQuery } from '@tanstack/react-query';
import { expensesApi } from '@/api/expenses.api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

interface Props {
  expenseId: string | null | undefined;
  open: boolean;
  onClose: () => void;
}

export function ExpenseDetailDialog({ expenseId, open, onClose }: Props) {
  const { data: expense, isLoading } = useQuery({
    queryKey: ['expense-detail', expenseId],
    queryFn: () => expensesApi.findOne(expenseId!),
    enabled: !!expenseId && open,
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle del Egreso</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4">Cargando...</p>
        ) : expense ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Código</p>
                <p className="font-mono text-xs font-medium">{expense.codigo}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Categoría</p>
                <p className="font-medium">{expense.category?.nombre || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fecha</p>
                <p className="font-medium">{expense.fecha}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Monto</p>
                <p className="font-medium">{formatCurrency(expense.monto)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Método de Pago</p>
                <p className="font-medium capitalize">{expense.metodoPago}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Referencia</p>
                <p className="font-medium">{expense.referencia || '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Concepto</p>
                <p className="font-medium">{expense.concepto}</p>
              </div>
            </div>
            {expense.supplier && (
              <div className="text-sm">
                <p className="text-muted-foreground">Proveedor</p>
                <p className="font-medium">{expense.supplier.razonSocial}</p>
              </div>
            )}
            {expense.purchaseOrder && (
              <div className="text-sm">
                <p className="text-muted-foreground">Orden de Compra</p>
                <p className="font-mono text-xs font-medium">{expense.purchaseOrder.codigo}</p>
              </div>
            )}
            {expense.observaciones && (
              <div className="text-sm">
                <p className="text-muted-foreground">Observaciones</p>
                <p className="font-medium">{expense.observaciones}</p>
              </div>
            )}
            {(expense.comprobanteFile?.url) && (
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Comprobante</p>
                <Button variant="outline" size="sm" asChild>
                  <a href={expense.comprobanteFile.url} target="_blank" rel="noopener noreferrer">
                    <FileText className="mr-1 h-4 w-4" /> Ver Comprobante <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4">Egreso no encontrado</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
