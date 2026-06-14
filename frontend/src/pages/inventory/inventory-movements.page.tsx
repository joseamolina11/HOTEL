import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/api/inventory.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { format } from 'date-fns';

const tipoColors: Record<string, string> = {
  entrada: 'bg-green-100 text-green-800',
  salida: 'bg-red-100 text-red-800',
  ajuste: 'bg-yellow-100 text-yellow-800',
};

export function InventoryMovementsPage() {
  const [page, setPage] = useState(1);
  const { data: response, isLoading } = useQuery({
    queryKey: ['inventory-movements', page],
    queryFn: () => inventoryApi.findAllMovements({ page: String(page), limit: '10' }),
  });
  const movements = response?.data?.data || [];
  const totalPages = response?.data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Movimientos de Productos</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {movements.length} movimiento{movements.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Producto</th>
                  <th className="px-4 py-3 text-left font-medium">Tipo</th>
                  <th className="px-4 py-3 text-right font-medium">Cantidad</th>
                  <th className="px-4 py-3 text-right font-medium">Stock Anterior</th>
                  <th className="px-4 py-3 text-right font-medium">Stock Posterior</th>
                  <th className="px-4 py-3 text-right font-medium">Costo Unit.</th>
                  <th className="px-4 py-3 text-left font-medium">Usuario</th>
                  <th className="px-4 py-3 text-left font-medium">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium">Obs.</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                ) : movements.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Sin movimientos registrados</td></tr>
                ) : (
                  movements.map((mov: any) => (
                    <tr key={mov.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{mov.inventoryItem?.nombre || mov.inventoryItemId}</td>
                      <td className="px-4 py-3">
                        <Badge className={tipoColors[mov.tipo]} variant="outline">{mov.tipo}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">{mov.cantidad}</td>
                      <td className="px-4 py-3 text-right">{mov.stockAnterior}</td>
                      <td className="px-4 py-3 text-right">{mov.stockPosterior}</td>
                      <td className="px-4 py-3 text-right">
                        {mov.precioUnitario != null ? `$${Number(mov.precioUnitario).toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {mov.user ? `${mov.user.nombres} ${mov.user.apellidos}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {format(new Date(mov.createdAt), 'dd/MM/yy HH:mm')}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[150px] truncate">
                        {mov.observaciones || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
