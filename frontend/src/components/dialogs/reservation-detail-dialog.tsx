import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { checkoutApi } from '@/api/checkout.api';
import { reciboCajaApi } from '@/api/recibo-caja.api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ReciboCajaDetailDialog } from '@/components/dialogs/recibo-caja-detail-dialog';
import { formatCurrency } from '@/lib/utils';
import { ExternalLink, Receipt, ShoppingCart, CreditCard, Package, BedDouble, Printer } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  checkin: 'Check-In',
  checkout: 'Check-Out',
  cancelada: 'Cancelada',
};

const STATUS_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmada: 'bg-blue-100 text-blue-800 border-blue-200',
  checkin: 'bg-green-100 text-green-800 border-green-200',
  checkout: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelada: 'bg-red-100 text-red-800 border-red-200',
};

export function ReservationDetailDialog({ reservation, open, onClose, onNavigateReservations }: {
  reservation: any;
  open: boolean;
  onClose: () => void;
  onNavigateReservations?: () => void;
}) {
  const [reciboDetailId, setReciboDetailId] = useState<string | null>(null);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['stay-summary', reservation?.id],
    queryFn: () => checkoutApi.getStaySummary(reservation!.id),
    enabled: !!reservation && open,
  });

  const { data: reciboData } = useQuery({
    queryKey: ['recibo-by-reservation', reservation?.id],
    queryFn: () => reciboCajaApi.findByReservation(reservation!.id),
    enabled: !!reservation && open && (reservation.estado === 'checkout' || reservation.estado === 'checkin'),
  });

  const res = summary?.reservation || reservation;
  const s = summary?.summary;
  const recibo = reciboData?.recibo;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Reserva {res?.codigo || ''}
              {res?.estado && <Badge variant="outline" className={STATUS_COLORS[res.estado]}>{STATUS_LABELS[res.estado] || res.estado}</Badge>}
            </DialogTitle>
          </DialogHeader>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Cargando...</div>
          ) : res ? (
            <div className="space-y-6">
              <div className="rounded-lg bg-muted p-4 text-sm grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-6">
                <div>
                  <span className="text-muted-foreground text-xs block">Huésped</span>
                  <span className="font-medium">{res.guest?.nombres || ''} {res.guest?.apellidos || ''}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Documento</span>
                  <span>{res.guest?.documento || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Teléfono</span>
                  <span>{res.guest?.telefono || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Habitación</span>
                  <span className="font-medium">{res.room?.nombre || '—'} ({res.room?.roomType?.nombre || '—'})</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Origen</span>
                  <span className="capitalize">{res.origen || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Huéspedes</span>
                  <span>{res.cantidadHuespedes || 1}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Entrada</span>
                  <span>{res.fechaEntrada ? new Date(res.fechaEntrada).toLocaleDateString() : '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Salida</span>
                  <span>{res.fechaSalida ? new Date(res.fechaSalida).toLocaleDateString() : '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Noches</span>
                  <span className="font-medium">{s?.noches || 0}</span>
                </div>
                {recibo && (
                  <div className="col-span-full flex items-center gap-2 mt-1">
                    <Receipt className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground text-xs">Recibo de Caja:</span>
                    <button
                      className="text-primary hover:underline cursor-pointer font-medium text-sm inline-flex items-center gap-1"
                      onClick={() => setReciboDetailId(recibo.id)}
                    >
                      {recibo.codigo} <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <div className="col-span-full flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={async () => {
                    const { printReservation } = await import('@/lib/print-document');
                    printReservation(res.id);
                  }}>
                    <Printer className="h-3 w-3 mr-1" /> Imprimir
                  </Button>
                  {onNavigateReservations && (
                    <Button variant="outline" size="sm" onClick={onNavigateReservations}>
                      Ir a Reservas <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>

              {res.companions?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Acompañantes</h3>
                  <div className="rounded-lg bg-muted p-3 text-sm flex flex-wrap gap-4">
                    {res.companions.map((c: any) => (
                      <span key={c.id} className="bg-background px-2 py-1 rounded text-xs">{c.nombres} {c.apellidos}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <BedDouble className="h-4 w-4" /> Habitación
                </h3>
                <div className="rounded-lg bg-muted p-4 text-sm grid grid-cols-2 gap-y-2 gap-x-6">
                  <div>
                    <span className="text-muted-foreground">Precio por noche:</span>
                    <span className="ml-2 font-medium">{formatCurrency(s?.precioPorNoche || 0)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total habitación:</span>
                    <span className="ml-2 font-medium">{formatCurrency(s?.totalHabitacion || 0)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Check-In:</span>
                    <span className="ml-2">{res.checkIn ? new Date(res.checkIn.fechaHora).toLocaleString() : '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Check-Out:</span>
                    <span className="ml-2">{res.checkOut ? new Date(res.checkOut.fechaHora).toLocaleString() : '—'}</span>
                  </div>
                </div>
              </div>

              {res.consumptions?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <Package className="h-4 w-4" /> Consumos ({res.consumptions.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="px-3 py-2 text-left font-medium">Producto</th>
                          <th className="px-3 py-2 text-center font-medium">Cant.</th>
                          <th className="px-3 py-2 text-right font-medium">P. Unit.</th>
                          <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {res.consumptions.map((c: any) => (
                          <tr key={c.id} className="border-b">
                            <td className="px-3 py-2">{c.inventoryItem?.nombre || '—'}</td>
                            <td className="px-3 py-2 text-center">{c.cantidad}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(c.precioUnitario)}</td>
                            <td className="px-3 py-2 text-right font-medium">{formatCurrency(c.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {s && s.pedidos && s.pedidos.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <ShoppingCart className="h-4 w-4" /> Pedidos ({s.pedidos.length})
                  </h3>
                  <div className="space-y-2">
                    {s.pedidos.map((o: any) => (
                      <div key={o.id} className="rounded-lg border p-3 text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{o.codigo || 'Pedido'}</span>
                          <Badge variant="outline" className="text-xs">{o.estado}</Badge>
                        </div>
                        {o.items?.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-xs text-muted-foreground pl-2">
                            <span>{item.cantidad}x {item.inventoryItem?.nombre || '—'}</span>
                            <span>{formatCurrency(item.subtotal)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-xs font-medium pt-1 mt-1 border-t">
                          <span>Total pedido</span>
                          <span>{formatCurrency(o.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {s && s.payments && s.payments.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <CreditCard className="h-4 w-4" /> Pagos ({s.payments.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="px-3 py-2 text-left font-medium">Fecha</th>
                          <th className="px-3 py-2 text-left font-medium">Concepto</th>
                          <th className="px-3 py-2 text-right font-medium">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.payments.map((p: any) => (
                          <tr key={p.id} className="border-b">
                            <td className="px-3 py-2 text-xs text-muted-foreground">{p.fecha ? new Date(p.fecha).toLocaleDateString() : '—'}</td>
                            <td className="px-3 py-2">{p.observaciones || '—'}</td>
                            <td className="px-3 py-2 text-right font-medium">{formatCurrency(p.monto)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="border-t" />
              <div className="flex justify-end">
                <div className="w-72 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total habitación</span>
                    <span>{formatCurrency(s?.totalHabitacion || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total consumos</span>
                    <span>{formatCurrency(s?.totalConsumos || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total pedidos</span>
                    <span>{formatCurrency(s?.totalPedidos || 0)}</span>
                  </div>
                  <div className="border-t" />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total estadía</span>
                    <span>{formatCurrency(s?.totalEstancia || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pagado</span>
                    <span className="text-green-600">{formatCurrency(s?.totalPagado || 0)}</span>
                  </div>
                  {Number(s?.saldoPendiente) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Saldo pendiente</span>
                      <span className="text-red-600 font-medium">{formatCurrency(s?.saldoPendiente || 0)}</span>
                    </div>
                  )}
                </div>
              </div>

              {res.contratoFile && (
                <div className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                  <span className="text-muted-foreground">Contrato:</span>
                  <span className="flex-1 truncate">{res.contratoFile.originalName}</span>
                  <a href={res.contratoFile.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                    Ver <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-destructive">No se pudo cargar la reserva</div>
          )}
        </DialogContent>
      </Dialog>
      <ReciboCajaDetailDialog reciboId={reciboDetailId} open={!!reciboDetailId} onClose={() => setReciboDetailId(null)} />
    </>
  );
}
