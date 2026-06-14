import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { roomsApi } from '@/api/rooms.api';
import { inventoryApi } from '@/api/inventory.api';
import { useRoomOrders, useCreateOrder, useCancelOrder } from '@/hooks/useOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { Plus, X, ShoppingCart, Trash2, Search, Loader2 } from 'lucide-react';
import { toastSuccess } from '@/lib/notifications';
import { formatDateTime, formatCurrency } from '@/lib/utils';

export function OrdersPage() {
  const [searchParams] = useSearchParams();
  const [selectedRoom, setSelectedRoom] = useState(searchParams.get('roomId') || '');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);

  const { data: rooms } = useQuery({
    queryKey: ['rooms', 'ocupadas'],
    queryFn: () => roomsApi.findAll({ estado: 'ocupada' }),
  });

  const { data: orders, refetch } = useRoomOrders(selectedRoom, page);

  const roomOptions = (rooms || []).map((r: any) => ({
    value: r.id,
    label: `${r.numero} - ${r.nombre}`,
  }));

  const selectedRoomOrders = orders?.data?.data || [];
  const totalPages = orders?.data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        {selectedRoom && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Pedido
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Seleccionar Habitación</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            placeholder="Elige una habitación ocupada..."
            options={roomOptions}
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
          />
        </CardContent>
      </Card>

      {selectedRoom && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {selectedRoomOrders.length} pedido{selectedRoomOrders.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-medium">Código</th>
                    <th className="px-4 py-3 text-left font-medium">Fecha</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                    <th className="px-4 py-3 text-center font-medium">Estado</th>
                    <th className="px-4 py-3 text-left font-medium">Atendió</th>
                    <th className="px-4 py-3 text-center font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRoomOrders.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Sin pedidos para esta habitación</td></tr>
                  ) : (
                    selectedRoomOrders.map((order: any) => (
                      <tr key={order.id} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">{order.codigo}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDateTime(order.fecha)}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(order.total)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={order.estado === 'pendiente' ? 'warning' : order.estado === 'pagado' ? 'success' : 'destructive'}>
                            {order.estado}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">{order.user?.nombres} {order.user?.apellidos}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setShowDetail(order)}>
                              <Search className="h-3 w-3" />
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
      )}
      {selectedRoom && <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />}

      <CreateOrderDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        roomId={selectedRoom}
        onSuccess={() => { setShowCreate(false); refetch(); }}
      />

      <OrderDetailDialog order={showDetail} onClose={() => setShowDetail(null)} />
    </div>
  );
}

function OrderDetailDialog({ order, onClose }: { order: any; onClose: () => void }) {
  const cancelMut = useCancelOrder();

  if (!order) return null;

  const handleCancel = async () => {
    await cancelMut.mutateAsync(order.id);
    toastSuccess('Pedido cancelado');
    onClose();
  };

  return (
    <Dialog open={!!order} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pedido {order.codigo}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Habitación: </span>
              <span className="font-medium">{order.room?.numero} - {order.room?.nombre}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Fecha: </span>
              <span className="font-medium">{formatDateTime(order.fecha)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Estado: </span>
              <Badge variant={order.estado === 'pendiente' ? 'warning' : order.estado === 'pagado' ? 'success' : 'destructive'}>
                {order.estado}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Atendió: </span>
              <span className="font-medium">{order.user?.nombres} {order.user?.apellidos}</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Productos</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-2 py-1 text-left">Producto</th>
                  <th className="px-2 py-1 text-right">Cant.</th>
                  <th className="px-2 py-1 text-right">P.Unit</th>
                  <th className="px-2 py-1 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item: any) => (
                  <tr key={item.id} className="border-b">
                    <td className="px-2 py-1">{item.inventoryItem?.nombre}</td>
                    <td className="px-2 py-1 text-right">{item.cantidad}</td>
                    <td className="px-2 py-1 text-right">{formatCurrency(item.precioUnitario)}</td>
                    <td className="px-2 py-1 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="px-2 py-2 text-right font-bold">Total</td>
                  <td className="px-2 py-2 text-right font-bold">{formatCurrency(order.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {order.observaciones && (
            <div className="text-sm">
              <span className="text-muted-foreground">Observaciones: </span>
              <span>{order.observaciones}</span>
            </div>
          )}

          <div className="flex justify-end gap-2">
            {order.estado === 'pendiente' && (
              <Button variant="destructive" onClick={handleCancel} disabled={cancelMut.isPending}>
                {cancelMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Cancelar Pedido
              </Button>
            )}
            <DialogClose asChild>
              <Button variant="outline">Cerrar</Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateOrderDialog({ open, onClose, roomId, onSuccess }: {
  open: boolean;
  onClose: () => void;
  roomId: string;
  onSuccess: () => void;
}) {
  const [items, setItems] = useState<{ inventoryItemId: string; nombre: string; cantidad: number; precioUnitario: number }[]>([]);
  const [search, setSearch] = useState('');
  const createMut = useCreateOrder();

  const { data: productsResponse } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryApi.findAll(),
  });

  const products = productsResponse?.data?.data || [];
  const filtered = (products || []).filter((p: any) =>
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const addProduct = (product: any) => {
    const existing = items.find((i) => i.inventoryItemId === product.id);
    if (existing) {
      setItems(items.map((i) =>
        i.inventoryItemId === product.id ? { ...i, cantidad: i.cantidad + 1 } : i
      ));
    } else {
      setItems([...items, {
        inventoryItemId: product.id,
        nombre: product.nombre,
        cantidad: 1,
        precioUnitario: Number(product.precioVenta) || Number(product.costoUnitario) || 0,
      }]);
    }
    setSearch('');
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.inventoryItemId !== id));
  };

  const updateCantidad = (id: string, cantidad: number) => {
    if (cantidad < 1) return;
    setItems(items.map((i) => i.inventoryItemId === id ? { ...i, cantidad } : i));
  };

  const updatePrecio = (id: string, precioUnitario: number) => {
    setItems(items.map((i) => i.inventoryItemId === id ? { ...i, precioUnitario } : i));
  };

  const total = items.reduce((sum, i) => sum + i.cantidad * i.precioUnitario, 0);

  const handleSubmit = async () => {
    if (items.length === 0) return;
    await createMut.mutateAsync({
      roomId,
      items: items.map((i) => ({
        inventoryItemId: i.inventoryItemId,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
      })),
    });
    toastSuccess('Pedido creado');
    setItems([]);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setItems([]); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo Pedido</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar producto..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {search && (
            <div className="max-h-40 overflow-y-auto rounded-lg border">
              {filtered.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">Sin resultados</p>
              ) : (
                filtered.map((p: any) => (
                  <button
                    key={p.id}
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => addProduct(p)}
                  >
                    <span>{p.nombre}</span>
                    <span className="text-muted-foreground">
                      Stock: {p.stockActual} | {formatCurrency(p.precioVenta || p.costoUnitario)}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {items.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Productos seleccionados</h4>
              {items.map((item) => (
                <div key={item.inventoryItemId} className="flex items-center gap-2 rounded-lg border p-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.nombre}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateCantidad(item.inventoryItemId, item.cantidad - 1)}>
                      <span className="text-xs">−</span>
                    </Button>
                    <span className="w-6 text-center text-sm">{item.cantidad}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateCantidad(item.inventoryItemId, item.cantidad + 1)}>
                      <span className="text-xs">+</span>
                    </Button>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    className="w-20 h-8 text-xs"
                    value={item.precioUnitario}
                    onChange={(e) => updatePrecio(item.inventoryItemId, Number(e.target.value))}
                  />
                  <span className="w-16 text-right text-sm font-medium">
                    {formatCurrency(item.cantidad * item.precioUnitario)}
                  </span>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(item.inventoryItemId)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="flex justify-between pt-2 text-sm font-bold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          )}

          <Button className="w-full" disabled={items.length === 0 || createMut.isPending} onClick={handleSubmit}>
            {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Crear Pedido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
