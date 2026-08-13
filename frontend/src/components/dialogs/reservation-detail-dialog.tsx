import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { checkoutApi } from '@/api/checkout.api';
import { reciboCajaApi } from '@/api/recibo-caja.api';
import { paymentsApi } from '@/api/payments.api';
import { paymentMethodsApi } from '@/api/payment-methods.api';
import { reservationsApi } from '@/api/reservations.api';
import { useAuthStore } from '@/stores/auth.store';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReciboCajaDetailDialog } from '@/components/dialogs/recibo-caja-detail-dialog';
import { formatCurrency } from '@/lib/utils';
import { toastSuccess, toastError } from '@/lib/notifications';
import { useReservationSurcharges, useActiveSurchargeTypes, useCreateSurcharge, useRemoveSurcharge, useUpdateSurcharge } from '@/hooks/useSurcharges';
import { ExternalLink, Receipt, ShoppingCart, CreditCard, Package, BedDouble, Printer, Zap, Plus, X, Loader2, ArrowLeftRight, Pencil } from 'lucide-react';
import { generateDefaultContract } from '@/lib/print-contract';
import Swal from 'sweetalert2';

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
  const [newSurchargeType, setNewSurchargeType] = useState('');
  const [newSurchargeMonto, setNewSurchargeMonto] = useState(0);
  const [newSurchargeCantidad, setNewSurchargeCantidad] = useState(1);
  const [newSurchargeReferencia, setNewSurchargeReferencia] = useState('');
  const [editSurcharge, setEditSurcharge] = useState<any | null>(null);
  const [changeMethodFor, setChangeMethodFor] = useState<any | null>(null);
  const [editPaymentFor, setEditPaymentFor] = useState<any | null>(null);
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

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

  const { data: activeSurchargeTypes } = useActiveSurchargeTypes();
  const { data: surchargesData, refetch: refetchSurcharges } = useReservationSurcharges(
    reservation?.estado === 'checkin' ? reservation.id : undefined,
  );
  const surcharges = surchargesData?.data || surchargesData || [];
  const createSurchargeMut = useCreateSurcharge();
  const removeSurchargeMut = useRemoveSurcharge();
  const updateSurchargeMut = useUpdateSurcharge();

  const changeMethodMut = useMutation({
    mutationFn: ({ paymentId, metodoPagoId }: { paymentId: string; metodoPagoId: string }) =>
      paymentsApi.changeMetodoPago(paymentId, { metodoPagoId }),
    onSuccess: () => {
      toastSuccess('Método de pago actualizado');
      setChangeMethodFor(null);
      qc.invalidateQueries({ queryKey: ['stay-summary'] });
      qc.invalidateQueries({ queryKey: ['reservations'] });
    },
    onError: () => toastError('No se pudo cambiar el método de pago'),
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
              Reserva {res?.codigo || '—'}
              {res?.checkinConsecutivo && <span className="text-xs font-normal text-violet-600">· Check-in {res.checkinConsecutivo}</span>}
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

              {res.estado === 'checkin' && (
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <Zap className="h-4 w-4 text-violet-600" /> Recargos
                  </h3>
                  {surcharges.length > 0 && (
                    <div className="rounded-lg border mb-2 divide-y text-sm">
                      {surcharges.map((sc: any) => (
                        <div key={sc.id} className="flex items-center justify-between px-3 py-2">
                          <div>
                            <span className="font-medium text-violet-700">{sc.consecutivo || '—'}</span>
                            {sc.referencia && <span className="ml-2 text-xs text-muted-foreground">Ref: {sc.referencia}</span>}
                            <span className="ml-2 text-muted-foreground">{sc.descripcion} x{sc.cantidad}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{formatCurrency(sc.subtotal)}</span>
                            <Button
                              type="button" variant="ghost" size="icon" className="h-6 w-6"
                              onClick={() => {
                                setEditSurcharge({
                                  id: sc.id,
                                  surchargeTypeId: sc.surchargeTypeId || '',
                                  descripcion: sc.descripcion,
                                  monto: Number(sc.monto),
                                  cantidad: sc.cantidad,
                                  referencia: sc.referencia || '',
                                });
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button" variant="ghost" size="icon" className="h-6 w-6"
                              disabled={removeSurchargeMut.isPending}
                              onClick={async () => {
                                const res = await Swal.fire({
                                  title: '¿Anular el recargo?',
                                  text: `Se anulará el recargo ${sc.consecutivo || ''}. Esta acción no se puede revertir.`,
                                  icon: 'warning',
                                  showCancelButton: true,
                                  confirmButtonText: 'Sí, anular',
                                  cancelButtonText: 'Cancelar',
                                  confirmButtonColor: '#ef4444',
                                });
                                if (!res.isConfirmed) return;
                                try {
                                  await removeSurchargeMut.mutateAsync(sc.id);
                                  refetchSurcharges();
                                } catch (e: any) {
                                  const msg = e?.response?.data?.message || e?.message || 'No se pudo anular el recargo';
                                  toastError(Array.isArray(msg) ? msg.join(', ') : msg);
                                }
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs text-muted-foreground">Tipo</label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                        value={newSurchargeType}
                        onChange={(e) => {
                          const t = (activeSurchargeTypes || []).find((st: any) => st.id === e.target.value);
                          setNewSurchargeType(e.target.value);
                          setNewSurchargeMonto(t ? Number(t.montoDefault) : 0);
                        }}
                      >
                        <option value="">Seleccionar...</option>
                        {(activeSurchargeTypes || []).map((st: any) => (
                          <option key={st.id} value={st.id}>{st.nombre} — {formatCurrency(Number(st.montoDefault))}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-20 space-y-1">
                      <label className="text-xs text-muted-foreground">Cant.</label>
                      <Input type="number" min={1} value={newSurchargeCantidad}
                        onChange={(e) => setNewSurchargeCantidad(Number(e.target.value))} />
                    </div>
                    <div className="w-24 space-y-1">
                      <label className="text-xs text-muted-foreground">Monto</label>
                      <Input type="number" step="0.01" min={0} value={newSurchargeMonto || ''}
                        onChange={(e) => setNewSurchargeMonto(Number(e.target.value))} />
                    </div>
                    <div className="w-40 space-y-1">
                      <label className="text-xs text-muted-foreground">Referencia</label>
                      <Input placeholder="Opcional" value={newSurchargeReferencia}
                        onChange={(e) => setNewSurchargeReferencia(e.target.value)} />
                    </div>
                    <Button type="button" size="sm" disabled={!newSurchargeType || createSurchargeMut.isPending}
                      onClick={async () => {
                        const st = (activeSurchargeTypes || []).find((t: any) => t.id === newSurchargeType);
                        const res = await Swal.fire({
                          title: '¿Agregar el recargo?',
                          html: `
                            <div style="text-align:left;font-size:14px;line-height:1.8">
                              <div><strong>Recargo:</strong> ${st?.nombre || ''}</div>
                              <div><strong>Monto:</strong> ${formatCurrency(newSurchargeMonto * newSurchargeCantidad)}</div>
                              <div style="margin-top:6px;color:#6b7280">Esta acción no se puede revertir.</div>
                            </div>`,
                          icon: 'question',
                          showCancelButton: true,
                          confirmButtonText: 'Sí, agregar',
                          cancelButtonText: 'Cancelar',
                          confirmButtonColor: '#ef4444',
                        });
                        if (!res.isConfirmed) return;
                        await createSurchargeMut.mutateAsync({
                          reservationId: reservation.id,
                          surchargeTypeId: newSurchargeType,
                          descripcion: st?.nombre || '',
                          monto: newSurchargeMonto,
                          cantidad: newSurchargeCantidad,
                          referencia: newSurchargeReferencia || undefined,
                        });
                        setNewSurchargeType('');
                        setNewSurchargeCantidad(1);
                        setNewSurchargeMonto(0);
                        setNewSurchargeReferencia('');
                        refetchSurcharges();
                      }}
                    >
                      {createSurchargeMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
                      Agregar
                    </Button>
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
                          <th className="px-3 py-2 text-left font-medium">Método</th>
                          <th className="px-3 py-2 text-left font-medium">Cuenta</th>
                          <th className="px-3 py-2 text-right font-medium">Monto</th>
                          <th className="px-3 py-2 text-right font-medium"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.payments.map((p: any) => (
                          <tr key={p.id} className="border-b">
                            <td className="px-3 py-2 text-xs text-muted-foreground">{p.fecha ? new Date(p.fecha).toLocaleDateString() : '—'}</td>
                            <td className="px-3 py-2">{p.observaciones || '—'}</td>
                            <td className="px-3 py-2">{p.metodoPago?.nombre || '—'}</td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">{p.cuenta?.nombre || '—'}</td>
                            <td className="px-3 py-2 text-right font-medium">{formatCurrency(p.monto)}</td>
                            <td className="px-3 py-2 text-right">
                              {isAdmin ? (
                                <Button
                                  type="button" variant="ghost" size="sm" className="h-7 text-xs"
                                  onClick={() => setEditPaymentFor({ ...p, reservationId: res.id, reservationCodigo: res.codigo })}
                                  title="Editar pago (solo administrador)"
                                >
                                  <Pencil className="h-3 w-3 mr-1" /> Editar
                                </Button>
                              ) : ['confirmada', 'checkin'].includes(res.estado) ? (
                                <Button
                                  type="button" variant="ghost" size="sm" className="h-7 text-xs"
                                  onClick={() => setChangeMethodFor(p)}
                                >
                                  <ArrowLeftRight className="h-3 w-3 mr-1" /> Cambiar
                                </Button>
                              ) : '—'}
                            </td>
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total recargos</span>
                    <span className="text-violet-600">{formatCurrency(s?.totalRecargos || 0)}</span>
                  </div>
                  {Number(res.descuento) > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>Descuento</span>
                      <span>-{formatCurrency(res.descuento)}</span>
                    </div>
                  )}
                  <div className="border-t" />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total estadía</span>
                    <span>{formatCurrency(s?.totalEstancia || 0)}</span>
                  </div>
                  {/* <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pagado</span>
                    <span className="text-green-600">{formatCurrency(s?.totalPagado || 0)}</span>
                  </div> */}
                  {/* {Number(s?.saldoPendiente) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Saldo pendiente</span>
                      <span className="text-red-600 font-medium">{formatCurrency(s?.saldoPendiente || 0)}</span>
                    </div>
                  )} */}
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
      <ChangeMethodDialog
        payment={changeMethodFor}
        open={!!changeMethodFor}
        onClose={() => setChangeMethodFor(null)}
        onConfirm={(metodoPagoId) => changeMethodMut.mutateAsync({ paymentId: changeMethodFor.id, metodoPagoId })}
        isPending={changeMethodMut.isPending}
      />
      <EditPaymentDialog
        payment={editPaymentFor}
        open={!!editPaymentFor}
        onClose={() => setEditPaymentFor(null)}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ['stay-summary'] });
          qc.invalidateQueries({ queryKey: ['reservations'] });
          qc.invalidateQueries({ queryKey: ['recibo-by-reservation'] });
        }}
      />
      <EditSurchargeDialog
        surcharge={editSurcharge}
        open={!!editSurcharge}
        onClose={() => setEditSurcharge(null)}
        onSaved={refetchSurcharges}
      />
    </>
  );
}

function EditSurchargeDialog({ surcharge, open, onClose, onSaved }: {
  surcharge: any;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { data: activeSurchargeTypes } = useActiveSurchargeTypes();
  const updateSurchargeMut = useUpdateSurcharge();

  const [type, setType] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const [referencia, setReferencia] = useState('');

  useEffect(() => {
    if (surcharge) {
      setType(surcharge.surchargeTypeId || '');
      setDescripcion(surcharge.descripcion || '');
      setMonto(Number(surcharge.monto) || 0);
      setCantidad(surcharge.cantidad || 1);
      setReferencia(surcharge.referencia || '');
    }
  }, [surcharge]);

  const handleSave = async () => {
    if (!descripcion.trim() || monto <= 0) return;
    try {
      await updateSurchargeMut.mutateAsync({
        id: surcharge.id,
        dto: {
          surchargeTypeId: type || undefined,
          descripcion: descripcion.trim(),
          monto,
          cantidad,
          referencia: referencia || undefined,
        },
      });
      toastSuccess('Recargo actualizado');
      onSaved();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'No se pudo actualizar el recargo';
      toastError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Recargo</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Tipo</label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={type}
              onChange={(e) => {
                const t = (activeSurchargeTypes || []).find((st: any) => st.id === e.target.value);
                setType(e.target.value);
                if (t) {
                  setDescripcion(t.nombre || '');
                  setMonto(Number(t.montoDefault) || 0);
                }
              }}
            >
              <option value="">Seleccionar...</option>
              {(activeSurchargeTypes || []).map((st: any) => (
                <option key={st.id} value={st.id}>{st.nombre} — {formatCurrency(Number(st.montoDefault))}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Descripción</label>
            <Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Concepto del recargo" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Cantidad</label>
              <Input type="number" min={1} value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Monto unitario</label>
              <Input type="number" step="0.01" min={0} value={monto || ''} onChange={(e) => setMonto(Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Referencia</label>
            <Input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="rounded bg-muted px-3 py-2 text-sm flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">{formatCurrency(monto * cantidad)}</span>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button
              disabled={!descripcion.trim() || monto <= 0 || updateSurchargeMut.isPending}
              onClick={handleSave}
            >
              {updateSurchargeMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ChangeMethodDialog({ payment, open, onClose, onConfirm, isPending }: {
  payment: any;
  open: boolean;
  onClose: () => void;
  onConfirm: (metodoPagoId: string) => void;
  isPending: boolean;
}) {
  const [metodoPagoId, setMetodoPagoId] = useState('');

  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods-active'],
    queryFn: () => paymentMethodsApi.findAllActive(),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setMetodoPagoId(''); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" /> Cambiar método de pago
          </DialogTitle>
        </DialogHeader>
        {payment && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pago</span>
                <span className="font-medium">{formatCurrency(payment.monto)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Método actual</span>
                <span className="font-medium">{payment.metodoPago?.nombre || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cuenta actual</span>
                <span className="font-medium">{payment.cuenta?.nombre || '—'}</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Nuevo método de pago</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={metodoPagoId}
                onChange={(e) => setMetodoPagoId(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {(paymentMethods || [])
                  .filter((pm: any) => pm.id !== payment.metodoPagoId)
                  .map((pm: any) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.nombre}{pm.financialAccount ? ` — ${pm.financialAccount.nombre}` : ''}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Se generará una transferencia contable entre las cuentas de ambos métodos.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
              <Button className="flex-1" disabled={!metodoPagoId || isPending} onClick={() => onConfirm(metodoPagoId)}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowLeftRight className="mr-2 h-4 w-4" />}
                Confirmar cambio
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditPaymentDialog({ payment, open, onClose, onSaved }: {
  payment: any;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [monto, setMonto] = useState(0);
  const [metodoPagoId, setMetodoPagoId] = useState('');
  const [reservationId, setReservationId] = useState('');
  const [comprobante, setComprobante] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const updateMut = useMutation({
    mutationFn: (dto: {
      monto?: number;
      metodoPagoId?: string;
      reservationId?: string;
      comprobante?: string;
      observaciones?: string;
    }) => paymentsApi.update(payment.id, dto),
    onSuccess: () => {
      toastSuccess('Pago actualizado');
      onSaved();
      onClose();
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message || e?.message || 'No se pudo actualizar el pago';
      toastError(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods-active'],
    queryFn: () => paymentMethodsApi.findAllActive(),
    enabled: open,
  });

  const { data: reservationsData } = useQuery({
    queryKey: ['reservations', 'for-payment-edit'],
    queryFn: () => reservationsApi.findAll({ limit: '100' }),
    enabled: open,
  });
  const reservations = reservationsData?.data?.data || [];

  useEffect(() => {
    if (payment) {
      setMonto(Number(payment.monto) || 0);
      setMetodoPagoId(payment.metodoPago?.id || '');
      setReservationId(payment.reservationId || '');
      setComprobante(payment.comprobante || '');
      setObservaciones(payment.observaciones || '');
    }
  }, [payment]);

  const handleSave = async () => {
    if (monto < 0) return;
    const res = await Swal.fire({
      title: '¿Guardar los cambios del pago?',
      html: `
        <div style="text-align:left;font-size:14px;line-height:1.8">
          <div><strong>Nuevo monto:</strong> ${formatCurrency(monto)}</div>
          <div style="margin-top:6px;color:#6b7280">Se actualizará el recibo de caja, los movimientos financieros y la caja. Esta acción no se puede revertir.</div>
        </div>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
    });
    if (!res.isConfirmed) return;
    await updateMut.mutateAsync({
      monto,
      metodoPagoId,
      reservationId,
      comprobante: comprobante || undefined,
      observaciones: observaciones || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" /> Editar pago (solo administrador)
          </DialogTitle>
        </DialogHeader>
        {payment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Monto</label>
                <Input type="number" step="0.01" min={0} value={monto || ''} onChange={(e) => setMonto(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Método de pago</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={metodoPagoId}
                  onChange={(e) => setMetodoPagoId(e.target.value)}
                >
                  <option value="">Sin método</option>
                  {(paymentMethods || []).map((pm: any) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.nombre}{pm.financialAccount ? ` — ${pm.financialAccount.nombre}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Reserva relacionada</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={reservationId}
                onChange={(e) => setReservationId(e.target.value)}
              >
                <option value="">Sin reserva</option>
                {reservations.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.codigo} — {r.guest?.nombres} {r.guest?.apellidos} ({r.room?.nombre || 'sin hab.'})
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Al cambiar la reserva se actualiza también la habitación del pago y la del recibo de caja.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Comprobante</label>
                <Input value={comprobante} onChange={(e) => setComprobante(e.target.value)} placeholder="Opcional" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Observaciones</label>
                <Input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Concepto del pago" />
              </div>
            </div>
            <div className="rounded bg-muted px-3 py-2 text-sm">
              Esta acción actualizará también el recibo de caja, los movimientos financieros y la caja.
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button disabled={updateMut.isPending} onClick={handleSave}>
                {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Pencil className="h-4 w-4 mr-1" />}
                Guardar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
