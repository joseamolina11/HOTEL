import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { suppliesApi } from '@/api/supplies.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { SupplyItemForm } from '@/components/forms/supply-item-form';
import { SupplyMovementDialog } from '@/components/forms/supply-movement-dialog';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { useDeleteSupplyItem } from '@/hooks/useSupplies';
import { Search, AlertTriangle, Plus, Pencil, Trash2, History, RefreshCw, ArrowDownUp } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

const CATEGORIAS = [
  { value: '', label: 'Todas' },
  { value: 'limpieza', label: 'Limpieza' },
  { value: 'aseo_personal', label: 'Aseo Personal' },
  { value: 'blanqueria', label: 'Blanquería' },
  { value: 'cocina', label: 'Cocina' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'oficina', label: 'Oficina' },
];

export function SuppliesPage() {
  const [filter, setFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [page, setPage] = useState(1);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openMovement, setOpenMovement] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [movementItem, setMovementItem] = useState<any>(null);
  const [historyItem, setHistoryItem] = useState<any>(null);
  const qc = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ['supplies', filter, catFilter, page],
    queryFn: () => suppliesApi.findAll({ search: filter, categoria: catFilter, page: String(page), limit: '10' }),
  });
  const items = response?.data?.data || [];
  const totalPages = response?.data?.totalPages || 1;

  const deleteItem = useDeleteSupplyItem();

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
    setPage(1);
  }, []);

  const handleCatFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setCatFilter(e.target.value);
    setPage(1);
  }, []);

  const filtered = items.filter((item: any) => {
    const matchesSearch = item.nombre.toLowerCase().includes(filter.toLowerCase());
    const matchesCat = !catFilter || item.categoriaSuministro === catFilter;
    return matchesSearch && matchesCat;
  });

  const lowStockItems = items.filter((i: any) => i.stockActual <= i.stockMinimo);

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setOpenEdit(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Suministros</h1>
        <div className="flex items-center gap-4">
          {lowStockItems.length > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> {lowStockItems.length} stock bajo
            </Badge>
          )}
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar insumo..." className="pl-10" value={filter} onChange={handleFilterChange} />
          </div>
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Nuevo Insumo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nuevo Insumo</DialogTitle>
              </DialogHeader>
              <SupplyItemForm onSuccess={() => setOpenAdd(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <Select
          value={catFilter}
          onChange={handleCatFilterChange}
          options={CATEGORIAS}
          className="w-48"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {filtered.length} insumo{filtered.length !== 1 ? 's' : ''}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ['supplies'] })}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Insumo</th>
                  <th className="px-4 py-3 text-left font-medium">Categoría</th>
                  <th className="px-4 py-3 text-left font-medium">Unidad</th>
                  <th className="px-4 py-3 text-right font-medium">Stock</th>
                  <th className="px-4 py-3 text-right font-medium">Stock Mín.</th>
                  <th className="px-4 py-3 text-right font-medium">Costo</th>
                  <th className="px-4 py-3 text-left font-medium">Proveedor</th>
                  <th className="px-4 py-3 text-center font-medium">Estado</th>
                  <th className="px-4 py-3 text-center font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Sin insumos registrados</td></tr>
                ) : (
                  filtered.map((item: any) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <span className="font-medium">{item.nombre}</span>
                        {item.descripcion && <p className="text-xs text-muted-foreground">{item.descripcion}</p>}
                      </td>
                      <td className="px-4 py-3 capitalize">{item.categoriaSuministro}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.unidadMedida}</td>
                      <td className={`px-4 py-3 text-right font-medium ${item.stockActual <= item.stockMinimo ? 'text-destructive' : ''}`}>
                        {item.stockActual}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{item.stockMinimo}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.costoUnitario)}</td>
                      <td className="px-4 py-3">{item.proveedor || '—'}</td>
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
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Insumo</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <SupplyItemForm
              key={editingItem.id}
              initial={editingItem}
              onSuccess={() => { setOpenEdit(false); setEditingItem(null); }}
            />
          )}
        </DialogContent>
      </Dialog>

      <SupplyMovementDialog
        item={movementItem}
        onClose={() => setMovementItem(null)}
      />

      <SupplyHistoryDialog item={historyItem} onClose={() => setHistoryItem(null)} />
    </div>
  );
}

function SupplyHistoryDialog({ item, onClose }: { item: any; onClose: () => void }) {
  const { data: movements, isLoading } = useQuery({
    queryKey: ['supplies', 'movements', item?.id],
    queryFn: () => suppliesApi.findMovements(item.id),
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
