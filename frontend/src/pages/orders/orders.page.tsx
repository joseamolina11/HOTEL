import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { roomsApi } from '@/api/rooms.api';
import { inventoryApi } from '@/api/inventory.api';
import { useRoomOrders, useCreateOrder, useCancelOrder } from '@/hooks/useOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { Plus, X, ShoppingCart, Search, Loader2, Minus, Package } from 'lucide-react';
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
  const [activeCategory, setActiveCategory] = useState('');
  const createMut = useCreateOrder();

  const { data: productsResponse } = useQuery({
    queryKey: ['inventory', 'all'],
    queryFn: () => inventoryApi.findAll({ limit: '200' }),
  });

  const products: any[] = productsResponse?.data?.data || [];

  const categoryMap = useMemo(() => {
    const map = new Map<string, any[]>();
    products.forEach((p: any) => {
      if (!p.activo) return;
      const cat = p.category?.nombre || p.categoria || 'Sin categoría';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    });
    return map;
  }, [products]);

  const categories = useMemo(() => [...categoryMap.keys()], [categoryMap]);

  useEffect(() => {
    if (!activeCategory && categories.length > 0) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const currentProducts = categoryMap.get(activeCategory) || [];

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
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.inventoryItemId !== id));
  };

  const updateCantidad = (id: string, cantidad: number) => {
    if (cantidad < 1) return;
    setItems(items.map((i) => i.inventoryItemId === id ? { ...i, cantidad } : i));
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
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setItems([]); setActiveCategory(''); } }}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 gap-0 overflow-hidden">
        <div className="flex flex-col h-[calc(95vh-2rem)]">
          <div className="flex items-center justify-between border-b px-6 py-3">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Package className="h-5 w-5" /> Nuevo Pedido — POS
            </DialogTitle>
            <button type="button" onClick={() => { onClose(); setItems([]); setActiveCategory(''); }} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex gap-1 overflow-x-auto px-4 pt-4 pb-2 border-b shrink-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      activeCategory === cat
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {currentProducts.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Sin productos en esta categoría
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {currentProducts.map((product: any) => {
                      const outOfStock = product.stockActual <= 0;
                      return (
                        <button
                          key={product.id}
                          type="button"
                          disabled={outOfStock}
                          onClick={() => addProduct(product)}
                          className={`rounded-xl border p-3 text-left transition-all flex flex-col gap-1 ${
                            outOfStock
                              ? 'opacity-40 cursor-not-allowed bg-muted/30'
                              : 'hover:border-primary hover:shadow-sm hover:bg-accent/50 active:scale-[0.97]'
                          }`}
                        >
                          <span className="font-semibold text-sm leading-tight">{product.nombre}</span>
                          <span className="text-base font-bold text-primary">
                            {formatCurrency(product.precioVenta || product.costoUnitario)}
                          </span>
                          <span className={`text-xs ${outOfStock ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {outOfStock ? 'Sin stock' : `Stock: ${product.stockActual}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="w-72 lg:w-80 border-l bg-muted/20 flex flex-col shrink-0">
              <div className="px-4 py-3 border-b shrink-0">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" /> Pedido actual
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
                {items.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center text-sm text-muted-foreground">
                    <div>
                      <Package className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p>Selecciona productos</p>
                      <p className="text-xs">desde la izquierda</p>
                    </div>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.inventoryItemId} className="rounded-lg border bg-card p-2.5 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-sm font-medium leading-tight flex-1">{item.nombre}</span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.inventoryItemId)}
                          className="text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateCantidad(item.inventoryItemId, item.cantidad - 1)}
                            className="h-7 w-7 rounded-md border flex items-center justify-center hover:bg-accent text-muted-foreground"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-7 text-center text-sm font-medium tabular-nums">{item.cantidad}</span>
                          <button
                            type="button"
                            onClick={() => updateCantidad(item.inventoryItemId, item.cantidad + 1)}
                            className="h-7 w-7 rounded-md border flex items-center justify-center hover:bg-accent text-muted-foreground"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-sm font-bold tabular-nums">
                          {formatCurrency(item.cantidad * item.precioUnitario)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t px-4 py-3 space-y-3 shrink-0 bg-background">
                <div className="flex justify-between items-baseline">
                  <span className="text-muted-foreground text-sm">Subtotal</span>
                  <span className="font-bold text-lg tabular-nums">{formatCurrency(total)}</span>
                </div>
                <Button
                  className="w-full h-11 text-base font-semibold"
                  disabled={items.length === 0 || createMut.isPending}
                  onClick={handleSubmit}
                >
                  {createMut.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <ShoppingCart className="h-5 w-5 mr-2" />
                  )}
                  {createMut.isPending ? 'Creando...' : `Cobrar ${formatCurrency(total)}`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
