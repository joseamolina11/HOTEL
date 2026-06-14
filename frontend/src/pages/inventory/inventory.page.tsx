import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/api/inventory.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { InventoryItemForm } from '@/components/forms/inventory-item-form';
import { InventoryForm } from '@/components/forms/inventory-form';
import { InventoryMovementDialog } from '@/components/forms/inventory-movement-dialog';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { useDeleteInventoryItem } from '@/hooks/useInventory';
import { Search, AlertTriangle, Plus, Pencil, Trash2, History, RefreshCw, ArrowDownUp } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export function InventoryPage() {
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [movementItem, setMovementItem] = useState<any>(null);
  const [historyItem, setHistoryItem] = useState<any>(null);
  const qc = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ['inventory', filter, page],
    queryFn: () => inventoryApi.findAll({ search: filter, page: String(page), limit: '10' }),
  });
  const items = response?.data?.data || [];
  const totalPages = response?.data?.totalPages || 1;

  const deleteItem = useDeleteInventoryItem();

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
    setPage(1);
  }, []);

  const filtered = items.filter((item: any) => {
    const matchesSearch = item.nombre.toLowerCase().includes(filter.toLowerCase()) ||
      item.categoria.toLowerCase().includes(filter.toLowerCase());
    return matchesSearch;
  });

  const lowStockItems = items.filter((i: any) => i.stockActual <= i.stockMinimo);
  const itemOpts = items.map((i: any) => ({ value: i.id, label: `${i.nombre} (${i.stockActual} uds)` }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Productos</h1>
        <div className="flex items-center gap-4">
          {lowStockItems.length > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> {lowStockItems.length} stock bajo
            </Badge>
          )}
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar producto..." className="pl-10" value={filter} onChange={handleFilterChange} />
          </div>
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Nuevo Producto</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo Producto / Movimiento</DialogTitle>
              </DialogHeader>
              <InventoryForm onSuccess={() => setOpenAdd(false)} items={itemOpts} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ['inventory'] })}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Producto</th>
                  <th className="px-4 py-3 text-left font-medium">Categoría</th>
                  <th className="px-4 py-3 text-right font-medium">Stock</th>
                  <th className="px-4 py-3 text-right font-medium">Stock Mín.</th>
                  <th className="px-4 py-3 text-right font-medium">Costo</th>
                  <th className="px-4 py-3 text-right font-medium">Precio Vta</th>
                  <th className="px-4 py-3 text-center font-medium">Estado</th>
                  <th className="px-4 py-3 text-center font-medium">Mov.</th>
                  <th className="px-4 py-3 text-center font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Sin productos registrados</td></tr>
                ) : (
                  filtered.map((item: any) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{item.nombre}</td>
                      <td className="px-4 py-3 capitalize">{item.categoria}</td>
                      <td className={`px-4 py-3 text-right font-medium ${item.stockActual <= item.stockMinimo ? 'text-destructive' : ''}`}>
                        {item.stockActual}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{item.stockMinimo}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.costoUnitario)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.precioVenta || 0)}</td>
                      <td className="px-4 py-3 text-center">
                        {item.stockActual <= item.stockMinimo ? (
                          <Badge variant="destructive" className="inline-flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Bajo
                          </Badge>
                        ) : (
                          <Badge variant="success">OK</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setMovementItem(item)} title="Registrar movimiento">
                            <ArrowDownUp className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setHistoryItem(item)} title="Ver historial">
                            <History className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingItem(item); setOpenEdit(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteItem.mutate(item.id)}>
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

      <Dialog open={openEdit} onOpenChange={(v) => { setOpenEdit(v); if (!v) setEditingItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <InventoryItemForm
              key={editingItem.id}
              initial={editingItem}
              onSuccess={() => { setOpenEdit(false); setEditingItem(null); }}
            />
          )}
        </DialogContent>
      </Dialog>

      <InventoryMovementDialog
        item={movementItem}
        onClose={() => setMovementItem(null)}
        onSuccess={() => qc.invalidateQueries({ queryKey: ['inventory'] })}
      />

      <MovementHistoryDialog item={historyItem} onClose={() => setHistoryItem(null)} />
    </div>
  );
}

function MovementHistoryDialog({ item, onClose }: { item: any; onClose: () => void }) {
  const { data: movements, isLoading } = useQuery({
    queryKey: ['inventory', 'movements', item?.id],
    queryFn: () => inventoryApi.findMovements(item.id),
    enabled: !!item,
  });

  return (
    <Dialog open={!!item} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Historial de Movimientos — {item?.nombre}</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left font-medium">Fecha</th>
                <th className="px-4 py-2 text-left font-medium">Tipo</th>
                <th className="px-4 py-2 text-right font-medium">Cantidad</th>
                <th className="px-4 py-2 text-right font-medium">Stock Ant.</th>
                <th className="px-4 py-2 text-right font-medium">Stock Post.</th>
                <th className="px-4 py-2 text-right font-medium">Costo Ud.</th>
                <th className="px-4 py-2 text-left font-medium">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-4 text-center text-muted-foreground">Cargando...</td></tr>
              ) : movements?.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-4 text-center text-muted-foreground">Sin movimientos</td></tr>
              ) : (
                movements?.map((m: any) => (
                  <tr key={m.id} className="border-b">
                    <td className="px-4 py-2">{formatDateTime(m.createdAt)}</td>
                    <td className="px-4 py-2">
                      <Badge variant={m.tipo === 'entrada' ? 'success' : m.tipo === 'salida' ? 'destructive' : 'warning'}>
                        {m.tipo}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-right font-medium">{m.cantidad}</td>
                    <td className="px-4 py-2 text-right">{m.stockAnterior}</td>
                    <td className="px-4 py-2 text-right">{m.stockPosterior}</td>
                    <td className="px-4 py-2 text-right">{m.precioUnitario ? formatCurrency(m.precioUnitario) : '—'}</td>
                    <td className="px-4 py-2 text-muted-foreground">{m.observaciones || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end">
          <DialogClose asChild>
            <Button variant="outline">Cerrar</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
