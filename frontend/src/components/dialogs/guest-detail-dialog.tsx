import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guestsApi } from '@/api/guests.api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useGuest, useUpdateGuest } from '@/hooks/useGuests';
import { Loader2, Pencil, X, Check, Phone, Mail, Calendar, FileText, BedDouble, ShoppingCart, Receipt, CreditCard } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = { pendiente: 'Pendiente', confirmada: 'Confirmada', checkin: 'Check-In', checkout: 'Check-Out', cancelada: 'Cancelada' };
const STATUS_COLORS: Record<string, string> = { pendiente: 'bg-yellow-100 text-yellow-800', confirmada: 'bg-blue-100 text-blue-800', checkin: 'bg-green-100 text-green-800', checkout: 'bg-gray-100 text-gray-800', cancelada: 'bg-red-100 text-red-800' };

interface Props {
  guestId: string | null;
  open: boolean;
  onClose: () => void;
}

export function GuestDetailDialog({ guestId, open, onClose: onCloseProp }: Props) {
  const qc = useQueryClient();
  const updateGuest = useUpdateGuest();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  const { data: guest, isLoading } = useGuest(guestId || '');

  const res = guest;

  const startEdit = () => {
    setForm({
      nombres: res?.nombres || '',
      apellidos: res?.apellidos || '',
      documento: res?.documento || '',
      nacionalidad: res?.nacionalidad || '',
      telefono: res?.telefono || '',
      email: res?.email || '',
      fechaNacimiento: res?.fechaNacimiento || '',
      observaciones: res?.observaciones || '',
    });
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = async () => {
    if (!guestId) return;
    await updateGuest.mutateAsync({ id: guestId, dto: form });
    qc.invalidateQueries({ queryKey: ['guest', guestId] });
    setEditing(false);
  };

  const onClose = () => {
    setEditing(false);
    onCloseProp();
  };

  const reservations = res?.reservations || [];
  const totalReservations = reservations.length;
  const totalCompletadas = reservations.filter((r: any) => r.estado === 'checkout').length;
  const totalActivas = reservations.filter((r: any) => ['checkin', 'confirmada'].includes(r.estado)).length;

  let allOrders: any[] = [];
  let allRecibos: any[] = [];
  let totalConsumos = 0;
  let totalPedidos = 0;
  let totalPagado = 0;

  for (const r of reservations) {
    if (r.orders) allOrders.push(...r.orders);
    if (r.recibosCaja) allRecibos.push(...r.recibosCaja);
    if (r.consumptions) totalConsumos += r.consumptions.reduce((s: number, c: any) => s + Number(c.subtotal), 0);
    if (r.orders) totalPedidos += r.orders.reduce((s: number, o: any) => s + Number(o.total), 0);
  }
  for (const rc of allRecibos) {
    totalPagado += Number(rc.total);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {res ? `${res.nombres} ${res.apellidos}` : 'Cliente'}
            {res?.documento && <span className="text-sm font-normal text-muted-foreground">— {res.documento}</span>}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Cargando...</div>
        ) : res ? (
          <div className="space-y-6">
            {editing ? (
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Editar información</h3>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={cancelEdit}>
                      <X className="h-3 w-3 mr-1" /> Cancelar
                    </Button>
                    <Button type="button" size="sm" onClick={saveEdit} disabled={updateGuest.isPending}>
                      {updateGuest.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                      Guardar
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Nombres</label>
                    <Input value={form.nombres} onChange={(e) => setForm((p: any) => ({ ...p, nombres: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Apellidos</label>
                    <Input value={form.apellidos} onChange={(e) => setForm((p: any) => ({ ...p, apellidos: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Documento</label>
                    <Input value={form.documento} onChange={(e) => setForm((p: any) => ({ ...p, documento: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Nacionalidad</label>
                    <Input value={form.nacionalidad} onChange={(e) => setForm((p: any) => ({ ...p, nacionalidad: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Teléfono</label>
                    <Input value={form.telefono} onChange={(e) => setForm((p: any) => ({ ...p, telefono: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Email</label>
                    <Input value={form.email} onChange={(e) => setForm((p: any) => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Fecha de Nacimiento</label>
                    <Input type="date" value={form.fechaNacimiento} onChange={(e) => setForm((p: any) => ({ ...p, fechaNacimiento: e.target.value }))} />
                  </div>
                  <div className="space-y-1 col-span-full">
                    <label className="text-xs text-muted-foreground">Observaciones</label>
                    <Input value={form.observaciones} onChange={(e) => setForm((p: any) => ({ ...p, observaciones: e.target.value }))} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-muted p-4 text-sm grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-6">
                <div>
                  <span className="text-muted-foreground text-xs block">Nombre completo</span>
                  <span className="font-medium">{res.nombres} {res.apellidos}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Documento</span>
                  <span>{res.documento}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Nacionalidad</span>
                  <span>{res.nacionalidad}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block flex items-center gap-1"><Phone className="h-3 w-3" /> Teléfono</span>
                  <span>{res.telefono || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block flex items-center gap-1"><Mail className="h-3 w-3" /> Email</span>
                  <span>{res.email || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block flex items-center gap-1"><Calendar className="h-3 w-3" /> Fecha Nac.</span>
                  <span>{res.fechaNacimiento ? new Date(res.fechaNacimiento).toLocaleDateString() : '—'}</span>
                </div>
                {res.observaciones && (
                  <div className="col-span-full">
                    <span className="text-muted-foreground text-xs block">Observaciones</span>
                    <span>{res.observaciones}</span>
                  </div>
                )}
                <div className="col-span-full flex justify-end">
                  <Button variant="outline" size="sm" onClick={startEdit}>
                    <Pencil className="h-3 w-3 mr-1" /> Editar
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg border p-3 text-center">
                <div className="text-2xl font-bold">{totalReservations}</div>
                <div className="text-xs text-muted-foreground">Total Estancias</div>
              </div>
              <div className="rounded-lg border p-3 text-center border-green-200 bg-green-50">
                <div className="text-2xl font-bold text-green-700">{totalCompletadas}</div>
                <div className="text-xs text-green-600">Completadas</div>
              </div>
              <div className="rounded-lg border p-3 text-center border-blue-200 bg-blue-50">
                <div className="text-2xl font-bold text-blue-700">{totalActivas}</div>
                <div className="text-xs text-blue-600">Activas</div>
              </div>
              <div className="rounded-lg border p-3 text-center border-purple-200 bg-purple-50">
                <div className="text-2xl font-bold text-purple-700">{formatCurrency(totalPagado)}</div>
                <div className="text-xs text-purple-600">Total Pagado</div>
              </div>
            </div>

            {reservations.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-1"><BedDouble className="h-4 w-4" /> Historial de reservas ({reservations.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-3 py-2 text-left font-medium">Código</th>
                        <th className="px-3 py-2 text-left font-medium">Habitación</th>
                        <th className="px-3 py-2 text-left font-medium">Entrada</th>
                        <th className="px-3 py-2 text-left font-medium">Salida</th>
                        <th className="px-3 py-2 text-center font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservations.map((r: any) => (
                        <tr key={r.id} className="border-b hover:bg-muted/50">
                          <td className="px-3 py-2 font-mono font-medium">{r.codigo}</td>
                          <td className="px-3 py-2">{r.room?.nombre || '—'}</td>
                          <td className="px-3 py-2">{new Date(r.fechaEntrada).toLocaleDateString()}</td>
                          <td className="px-3 py-2">{new Date(r.fechaSalida).toLocaleDateString()}</td>
                          <td className="px-3 py-2 text-center">
                            <Badge variant="outline" className={STATUS_COLORS[r.estado] || ''}>{STATUS_LABELS[r.estado] || r.estado}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {allOrders.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-1"><ShoppingCart className="h-4 w-4" /> Pedidos ({allOrders.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-3 py-2 text-left font-medium">Código</th>
                        <th className="px-3 py-2 text-left font-medium">Reserva</th>
                        <th className="px-3 py-2 text-left font-medium">Items</th>
                        <th className="px-3 py-2 text-center font-medium">Estado</th>
                        <th className="px-3 py-2 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allOrders.map((o: any) => (
                        <tr key={o.id} className="border-b hover:bg-muted/50">
                          <td className="px-3 py-2 font-mono">{o.codigo}</td>
                          <td className="px-3 py-2">{o.reservationId ? (reservations.find((r: any) => r.id === o.reservationId)?.codigo || '—') : '—'}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {(o.items || []).map((i: any) => `${i.cantidad}x ${i.inventoryItem?.nombre || '—'}`).join(', ')}
                          </td>
                          <td className="px-3 py-2 text-center"><Badge variant="outline" className="text-xs">{o.estado}</Badge></td>
                          <td className="px-3 py-2 text-right font-medium">{formatCurrency(o.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {allRecibos.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-1"><Receipt className="h-4 w-4" /> Recibos de Caja ({allRecibos.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-3 py-2 text-left font-medium">Código</th>
                        <th className="px-3 py-2 text-left font-medium">Fecha</th>
                        <th className="px-3 py-2 text-left font-medium">Reserva</th>
                        <th className="px-3 py-2 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allRecibos.map((rc: any) => (
                        <tr key={rc.id} className="border-b hover:bg-muted/50">
                          <td className="px-3 py-2 font-mono font-medium">{rc.codigo}</td>
                          <td className="px-3 py-2">{rc.fecha || '—'}</td>
                          <td className="px-3 py-2">{reservations.find((r: any) => r.id === rc.reservationId)?.codigo || '—'}</td>
                          <td className="px-3 py-2 text-right font-medium">{formatCurrency(rc.total)}</td>
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
                  <span className="text-muted-foreground">Total consumos</span>
                  <span>{formatCurrency(totalConsumos)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total pedidos</span>
                  <span>{formatCurrency(totalPedidos)}</span>
                </div>
                <div className="border-t" />
                <div className="flex justify-between font-bold text-base">
                  <span>Total facturado</span>
                  <span>{formatCurrency(totalConsumos + totalPedidos)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total pagado</span>
                  <span className="text-green-600">{formatCurrency(totalPagado)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-destructive">No se pudo cargar el cliente</div>
        )}
      </DialogContent>
    </Dialog>
  );
}