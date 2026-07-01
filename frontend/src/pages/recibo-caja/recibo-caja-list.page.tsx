import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reciboCajaApi } from '@/api/recibo-caja.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { ReciboCajaDetailDialog } from '@/components/dialogs/recibo-caja-detail-dialog';
import { Plus, Trash2, Search, FileText, Eye } from 'lucide-react';
import { confirmAction, toastSuccess } from '@/lib/notifications';
import { formatCurrency } from '@/lib/utils';

export function ReciboCajaListPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ['recibo-caja', { page }],
    queryFn: () => reciboCajaApi.findAll({ page: String(page) }),
  });
  const recibos = (response as any)?.data?.data || [];
  const totalPages = (response as any)?.data?.totalPages || 1;

  const deleteMut = useMutation({
    mutationFn: (id: string) => reciboCajaApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recibo-caja'] }); toastSuccess('Recibo eliminado'); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recibos de Caja</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Historial de recibos</caption>
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Código</th>
                  <th className="px-4 py-3 text-left font-medium">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium">Fecha</th>
                  <th className="px-4 py-3 text-right font-medium">Subtotal</th>
                  <th className="px-4 py-3 text-right font-medium">Dto.</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-left font-medium">Pagos</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                ) : recibos.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Sin recibos registrados</td></tr>
                ) : (
                  recibos.map((r: any) => (
                    <tr key={r.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono text-xs font-medium">{r.codigo}</td>
                      <td className="px-4 py-3">{r.clienteNombre || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.fecha}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(r.subtotal)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(r.descuento)}</td>
                      <td className="px-4 py-3 text-right font-bold">{formatCurrency(r.total)}</td>
                      <td className="px-4 py-3">{r.pagos?.length || 0} pago(s)</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setDetailId(r.id)} title="Ver detalle">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={async () => {
                            const ok = await confirmAction('¿Eliminar recibo?', 'Esta acción no se puede deshacer');
                            if (ok) deleteMut.mutate(r.id);
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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

      <ReciboCajaDetailDialog reciboId={detailId} open={!!detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}
