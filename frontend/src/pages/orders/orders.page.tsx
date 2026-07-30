import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { roomsApi } from '@/api/rooms.api';
import { inventoryApi } from '@/api/inventory.api';
import { paymentMethodsApi } from '@/api/payment-methods.api';
import { useRoomOrders, useAllOrders, useCreateOrder, useUpdateOrder, useCancelOrder } from '@/hooks/useOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { Plus, X, ShoppingCart, Search, Loader2, Minus, Package, Ban, CreditCard, Pencil } from 'lucide-react';
import { toastSuccess } from '@/lib/notifications';
import { formatDateTime, formatCurrency } from '@/lib/utils';

const ALL_ROOMS = '__all__';

export function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRoom, setSelectedRoom] = useState(searchParams.get('roomId') || '');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [directSale, setDirectSale] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [editOrder, setEditOrder] = useState<any>(null);

  const { data: rooms } = useQuery({
    queryKey: ['rooms', 'ocupadas'],
    queryFn: () => roomsApi.findAll({ estado: 'ocupada' }),
  });

  const { data: allRooms } = useQuery({
    queryKey: ['rooms', 'all'],
    queryFn: () => roomsApi.findAll({ limit: '200' }),
  });

  const isAllRooms = selectedRoom === ALL_ROOMS;
  const { data: roomOrders, refetch: refetchRoomOrders } = useRoomOrders(isAllRooms ? '' : selectedRoom, page);
  const { data: allOrders, refetch: refetchAllOrders } = useAllOrders({ page: String(page), limit: '10' }, { enabled: isAllRooms });

  const roomOptions = [
    { value: ALL_ROOMS, label: 'Todas las habitaciones' },
    ...((allRooms || rooms || []).map((r: any) => ({
      value: r.id,
      label: `${r.numero} - ${r.nombre}`,
    }))),
  ];

  let rawData: any;
  let activeReservationId = '';
  if (isAllRooms) {
    rawData = allOrders?.data?.data;
  } else {
    const rd = roomOrders?.data;
    if (rd?.orders) {
      rawData = rd.orders;
      activeReservationId = rd.reservationId || '';
    } else {
      rawData = rd;
    }
  }
  const currentOrders = Array.isArray(rawData) ? rawData : rawData?.data || [];
  const totalPages = rawData?.totalPages || 1;
  const showRoomColumn = isAllRooms;

  useEffect(() => {
    if (activeReservationId && selectedRoom && selectedRoom !== ALL_ROOMS) {
      const params = new URLSearchParams(searchParams);
      params.set('roomId', selectedRoom);
      params.set('reservationId', activeReservationId);
      setSearchParams(params, { replace: true });
    }
  }, [activeReservationId, selectedRoom]);

  const refetch = () => { refetchRoomOrders(); refetchAllOrders(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <div className="flex gap-2">
          {selectedRoom && selectedRoom !== ALL_ROOMS && (
            <Button onClick={() => { setEditOrder(null); setDirectSale(false); setShowCreate(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Pedido
            </Button>
          )}
          <Button variant="outline" onClick={() => { setEditOrder(null); setDirectSale(true); setShowCreate(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Venta Directa
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Filtrar por habitación</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            placeholder="Seleccionar..."
            options={roomOptions}
            value={selectedRoom}
            onChange={(e) => { setSelectedRoom(e.target.value); setPage(1); }}
          />
        </CardContent>
      </Card>

      {selectedRoom && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {currentOrders.length} pedido{currentOrders.length !== 1 ? 's' : ''}
              {!isAllRooms && selectedRoom !== ALL_ROOMS && ` · ${(allRooms || rooms)?.find((r: any) => r.id === selectedRoom)?.numero || ''}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-medium">Código</th>
                    {showRoomColumn && <th className="px-4 py-3 text-left font-medium">Habitación</th>}
                    <th className="px-4 py-3 text-left font-medium">Fecha</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                    <th className="px-4 py-3 text-center font-medium">Estado</th>
                    <th className="px-4 py-3 text-left font-medium">Atendió</th>
                    <th className="px-4 py-3 text-center font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrders.length === 0 ? (
                    <tr><td colSpan={showRoomColumn ? 7 : 6} className="px-4 py-8 text-center text-muted-foreground">Sin pedidos</td></tr>
                  ) : (
                    currentOrders.map((order: any) => (
                      <tr key={order.id} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">{order.codigo}</td>
                        {showRoomColumn && (
                          <td className="px-4 py-3">{order.room ? `${order.room.numero} - ${order.room.nombre}` : '—'}</td>
                        )}
                        <td className="px-4 py-3 text-muted-foreground">{formatDateTime(order.fecha)}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(order.total)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={order.estado === 'pendiente' ? 'warning' : order.estado === 'pagado' ? 'success' : 'destructive'}>
                            {order.estado === 'pendiente' ? 'Pendiente' : order.estado === 'pagado' ? 'Pagado' : 'Anulado'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">{order.user?.nombres} {order.user?.apellidos}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1">
                            {order.estado === 'pendiente' && (
                              <Button variant="ghost" size="sm" onClick={() => { setEditOrder(order); setShowCreate(true); }}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                            )}
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
        onClose={() => { setShowCreate(false); setDirectSale(false); }}
        roomId={directSale ? '' : selectedRoom === ALL_ROOMS ? '' : selectedRoom}
        reservationId={activeReservationId}
        editOrder={editOrder}
        onSuccess={() => { setShowCreate(false); setDirectSale(false); setEditOrder(null); refetch(); }}
      />

      <OrderDetailDialog
        order={showDetail}
        onClose={() => { setShowDetail(null); refetch(); }}
        onEdit={(order) => { setShowDetail(null); setEditOrder(order); setShowCreate(true); }}
      />
    </div>
  );
}

function OrderDetailDialog({ order, onClose, onEdit }: { order: any; onClose: () => void; onEdit?: (order: any) => void }) {
  const cancelMut = useCancelOrder();

  if (!order) return null;

  const handleCancel = async () => {
    if (!confirm('¿Anular este pedido? Se revertirá el inventario y los movimientos contables.')) return;
    await cancelMut.mutateAsync(order.id);
    toastSuccess('Pedido anulado');
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
              <span className="font-medium">{order.room ? `${order.room.numero} - ${order.room.nombre}` : 'Venta directa'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Fecha: </span>
              <span className="font-medium">{formatDateTime(order.fecha)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Estado: </span>
              <Badge variant={order.estado === 'pendiente' ? 'warning' : order.estado === 'pagado' ? 'success' : 'destructive'}>
                {order.estado === 'pendiente' ? 'Pendiente' : order.estado === 'pagado' ? 'Pagado' : 'Anulado'}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Atendió: </span>
              <span className="font-medium">{order.user?.nombres} {order.user?.apellidos}</span>
            </div>
            {order.annulledBy && (
              <div>
                <span className="text-muted-foreground">Anuló: </span>
                <span className="font-medium">{order.annulledBy?.nombres} {order.annulledBy?.apellidos}</span>
              </div>
            )}
            {order.annulledAt && (
              <div>
                <span className="text-muted-foreground">Anulado: </span>
                <span className="font-medium">{formatDateTime(order.annulledAt)}</span>
              </div>
            )}
          </div>

          {!order.roomId && (
            <div className="rounded-lg bg-muted p-3 text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="font-medium">Venta directa</span>
            </div>
          )}

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
            {order.estado === 'pendiente' && onEdit && (
              <Button variant="outline" onClick={() => onEdit(order)}>
                <Pencil className="h-4 w-4 mr-1" /> Editar
              </Button>
            )}
            {(order.estado === 'pendiente' || order.estado === 'pagado') && (
              <Button variant="destructive" onClick={handleCancel} disabled={cancelMut.isPending}>
                {cancelMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Ban className="h-4 w-4 mr-1" />}
                {order.estado === 'pagado' ? 'Anular Pedido' : 'Cancelar Pedido'}
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

function CreateOrderDialog({ open, onClose, roomId, reservationId, editOrder, onSuccess }: {
  open: boolean;
  onClose: () => void;
  roomId: string;
  reservationId?: string;
  editOrder?: any;
  onSuccess: () => void;
}) {
  const [items, setItems] = useState<{ inventoryItemId: string; nombre: string; cantidad: number; precioUnitario: number }[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [pagoMetodoPagoId, setPagoMetodoPagoId] = useState('');
  const [pagoMonto, setPagoMonto] = useState(0);
  const [editRoomId, setEditRoomId] = useState('');
  const createMut = useCreateOrder();
  const updateMut = useUpdateOrder();

  const isDirectSale = !roomId && !editOrder;
  const isEditMode = !!editOrder;

  const { data: productsResponse } = useQuery({
    queryKey: ['inventory', 'all'],
    queryFn: () => inventoryApi.findAll({ limit: '200' }),
  });

  const { data: paymentMethodsData } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => paymentMethodsApi.findAll(),
    enabled: isDirectSale,
  });

  const { data: allRooms } = useQuery({
    queryKey: ['rooms', 'all'],
    queryFn: () => roomsApi.findAll({ limit: '200' }),
  });

  const products: any[] = productsResponse?.data?.data || [];
  const paymentMethods: any[] = paymentMethodsData?.data?.data || [];

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

  useEffect(() => {
    if (!open) return;
    if (editOrder) {
      setItems(editOrder.items?.map((i: any) => ({
        inventoryItemId: i.inventoryItemId,
        nombre: i.inventoryItem?.nombre || 'Producto',
        cantidad: i.cantidad,
        precioUnitario: Number(i.precioUnitario),
      })) || []);
      setEditRoomId(editOrder.roomId || '');
    } else {
      setItems([]);
      setEditRoomId('');
    }
    setPagoMetodoPagoId('');
    setPagoMonto(0);
  }, [open, editOrder]);

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

  useEffect(() => {
    if (!isDirectSale) return;
    if (total > 0 && pagoMonto === 0) setPagoMonto(total);
  }, [total, isDirectSale]);

  const handleSubmit = async () => {
    if (items.length === 0) return;
    const itemsDto = items.map((i) => ({ inventoryItemId: i.inventoryItemId, cantidad: i.cantidad, precioUnitario: i.precioUnitario }));

    if (isEditMode && editOrder) {
      await updateMut.mutateAsync({
        id: editOrder.id,
        dto: {
          items: itemsDto,
          roomId: editRoomId || undefined,
        },
      });
      toastSuccess('Pedido actualizado');
    } else if (isDirectSale) {
      await createMut.mutateAsync({
        ventaDirecta: true,
        items: itemsDto,
        ...(pagoMetodoPagoId ? { pagoMetodoPagoId, pagoMonto: pagoMonto > 0 ? pagoMonto : total } : {}),
      });
      toastSuccess('Venta directa creada');
    } else {
      await createMut.mutateAsync({
        roomId,
        reservationId: reservationId || undefined,
        items: itemsDto,
      });
      toastSuccess('Pedido creado');
    }

    setItems([]);
    setActiveCategory('');
    setPagoMetodoPagoId('');
    setPagoMonto(0);
    setEditRoomId('');
    onSuccess();
  };

  const isLoading = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setItems([]); setActiveCategory(''); setPagoMetodoPagoId(''); setPagoMonto(0); setEditRoomId(''); } }}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 gap-0 overflow-hidden">
        <div className="flex flex-col h-[calc(95vh-2rem)]">
          <div className="flex items-center justify-between border-b px-6 py-3">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Package className="h-5 w-5" />
              {isEditMode ? `Editar Pedido ${editOrder?.codigo}` : isDirectSale ? 'Venta Directa — POS' : 'Nuevo Pedido — POS'}
            </DialogTitle>
            <button type="button" onClick={() => { onClose(); setItems([]); setActiveCategory(''); setPagoMetodoPagoId(''); setPagoMonto(0); setEditRoomId(''); }} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              {isDirectSale && (
                <div className="flex gap-2 p-3 border-b bg-muted/10 shrink-0 items-end">
                  <div className="w-48">
                    <label className="text-xs font-medium mb-1 block">Método de pago</label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      value={pagoMetodoPagoId}
                      onChange={(e) => setPagoMetodoPagoId(e.target.value)}
                    >
                      <option value="">Sin pago (pendiente)</option>
                      {paymentMethods.map((pm: any) => (
                        <option key={pm.id} value={pm.id}>{pm.nombre}</option>
                      ))}
                    </select>
                  </div>
                  {pagoMetodoPagoId && (
                    <div className="w-36">
                      <label className="text-xs font-medium mb-1 block">Monto</label>
                      <input
                        type="number"
                        min={0}
                        value={pagoMonto}
                        onChange={(e) => setPagoMonto(Number(e.target.value))}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      />
                    </div>
                  )}
                </div>
              )}
              {isEditMode && (
                <div className="flex gap-2 p-3 border-b bg-muted/10 shrink-0 items-end">
                  <div className="w-64">
                    <label className="text-xs font-medium mb-1 block">Cambiar habitación</label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      value={editRoomId}
                      onChange={(e) => setEditRoomId(e.target.value)}
                    >
                      <option value="">Sin habitación (venta directa)</option>
                      {(allRooms || []).map((r: any) => (
                        <option key={r.id} value={r.id}>{r.numero} - {r.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
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
                      const inCart = items.find(i => i.inventoryItemId === product.id);
                      return (
                        <button
                          key={product.id}
                          type="button"
                          disabled={outOfStock}
                          onClick={() => addProduct(product)}
                          className={`rounded-xl border p-3 text-left transition-all flex flex-col gap-1 ${
                            inCart ? 'ring-2 ring-primary/50 bg-primary/5' : ''
                          } ${
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
                            {inCart && <span className="ml-1 text-primary">· {inCart.cantidad} en carro</span>}
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
                  <ShoppingCart className="h-4 w-4" /> {isEditMode ? 'Editar' : isDirectSale ? 'Venta' : 'Pedido'} actual
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
                  <span className="text-muted-foreground text-sm">Total</span>
                  <span className="font-bold text-lg tabular-nums">{formatCurrency(total)}</span>
                </div>
                <Button
                  className="w-full h-11 text-base font-semibold"
                  disabled={items.length === 0 || isLoading}
                  onClick={handleSubmit}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <ShoppingCart className="h-5 w-5 mr-2" />
                  )}
                  {isLoading
                    ? 'Guardando...'
                    : isEditMode
                      ? `Guardar cambios ${formatCurrency(total)}`
                      : isDirectSale
                        ? `Vender ${formatCurrency(total)}`
                        : `Cobrar ${formatCurrency(total)}`
                  }
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
