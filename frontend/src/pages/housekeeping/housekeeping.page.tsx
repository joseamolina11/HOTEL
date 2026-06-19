import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { housekeepingApi } from '@/api/housekeeping.api';
import { suppliesApi } from '@/api/supplies.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/shared/status-badge';
import { Sparkles, Wrench, CheckCircle, Package, Plus, Trash2, ClipboardList } from 'lucide-react';
import { toastSuccess, confirmAction } from '@/lib/notifications';
import { useAuthStore } from '@/stores/auth.store';

const TABS = [
  { key: 'limpieza', label: 'Limpieza', icon: Sparkles },
  { key: 'mantenimiento', label: 'Mantenimiento', icon: Wrench },
];

export function HousekeepingPage() {
  const [tab, setTab] = useState('limpieza');
  const [assignRoom, setAssignRoom] = useState<any>(null);
  const [supplyRows, setSupplyRows] = useState<{ supplyItemId: string; cantidad: number }[]>([]);
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['housekeeping', tab],
    queryFn: () => housekeepingApi.findAll(tab),
  });

  const { data: supplyItems = [] } = useQuery({
    queryKey: ['supplies-options-all'],
    queryFn: () => suppliesApi.findAll({ limit: '200' }).then(r => r?.data?.data || []),
  });

  const changeStatusMut = useMutation({
    mutationFn: ({ roomId, estado }: { roomId: string; estado: string }) =>
      housekeepingApi.changeStatus(roomId, estado),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['housekeeping'] }); qc.invalidateQueries({ queryKey: ['rooms'] }); },
  });

  const assignSuppliesMut = useMutation({
    mutationFn: ({ roomId, items }: { roomId: string; items: { supplyItemId: string; cantidad: number }[] }) =>
      housekeepingApi.assignSupplies(roomId, items),
    onSuccess: () => {
      toastSuccess('Insumos asignados a la habitación');
      setAssignRoom(null);
      setSupplyRows([]);
      qc.invalidateQueries({ queryKey: ['housekeeping'] });
    },
  });

  const completeCleaningMut = useMutation({
    mutationFn: (roomId: string) => housekeepingApi.completeCleaning(roomId),
    onSuccess: () => {
      toastSuccess('Limpieza completada. Insumos descontados del inventario.');
      qc.invalidateQueries({ queryKey: ['housekeeping'] });
      qc.invalidateQueries({ queryKey: ['supplies'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  const handleChangeStatus = async (room: any, estado: string) => {
    const labels: Record<string, string> = { disponible: 'Disponible', limpieza: 'Limpieza', mantenimiento: 'Mantenimiento' };
    const result = await confirmAction('Cambiar Estado', `¿Marcar habitación ${room.numero} como "${labels[estado]}"?`);
    if (result.isConfirmed) {
      changeStatusMut.mutate({ roomId: room.id, estado });
    }
  };

  const openAssignSupplies = (room: any) => {
    setAssignRoom(room);
    setSupplyRows(room.assignedSupplies?.length > 0
      ? room.assignedSupplies.map((s: any) => ({ supplyItemId: s.supplyItemId, cantidad: s.cantidad }))
      : [{ supplyItemId: '', cantidad: 1 }]
    );
  };

  const addRow = () => {
    setSupplyRows([...supplyRows, { supplyItemId: '', cantidad: 1 }]);
  };

  const removeRow = (index: number) => {
    setSupplyRows(supplyRows.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof typeof supplyRows[0], value: string | number) => {
    const updated = [...supplyRows];
    (updated[index] as any)[field] = value;
    setSupplyRows(updated);
  };

  const handleAssignSupplies = () => {
    const valid = supplyRows.filter((r) => r.supplyItemId && r.cantidad > 0);
    if (valid.length === 0) return;
    assignSuppliesMut.mutate({ roomId: assignRoom.id, items: valid });
  };

  const handleCompleteCleaning = async (room: any) => {
    const hasSupplies = room.assignedSupplies?.length > 0;
    const msg = hasSupplies
      ? `Se descontarán ${room.assignedSupplies.length} insumo(s) del inventario. ¿Confirmar?`
      : `¿Marcar habitación ${room.numero} como Disponible?`;
    const result = await confirmAction('Completar Limpieza', msg);
    if (result.isConfirmed) {
      completeCleaningMut.mutate(room.id);
    }
  };

  const filteredSupplies = supplyItems.filter((i: any) => i.stockActual > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Housekeeping</h1>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <Button key={t.key} variant={tab === t.key ? 'default' : 'outline'} onClick={() => setTab(t.key)}>
            <t.icon className="mr-2 h-4 w-4" /> {t.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="h-32 animate-pulse bg-muted rounded" />
      ) : rooms.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">No hay habitaciones en esta categoría</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room: any) => (
            <Card key={room.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{room.numero} - {room.nombre}</CardTitle>
                  <StatusBadge status={room.estado} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-3 text-sm text-muted-foreground">
                  <span>Piso {room.piso}</span>
                  {room.roomType && <><span className="mx-2">•</span><span>{room.roomType.nombre}</span></>}
                </div>

                {room.estado === 'limpieza' && (
                  <>
                    <div className="mb-3 space-y-1">
                      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <ClipboardList className="h-3 w-3" /> Insumos asignados:
                      </div>
                      {room.assignedSupplies?.length > 0 ? (
                        <ul className="text-xs space-y-0.5">
                          {room.assignedSupplies.map((s: any) => (
                            <li key={s.id} className="flex items-center gap-1">
                              <Package className="h-3 w-3 text-primary" />
                              <span className="font-medium">{s.cantidad}x</span>
                              <span>{s.supplyItem?.nombre || '—'}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Sin insumos asignados</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {
                        user?.role === 'admin' && (
                          <Button size="sm" variant="outline" onClick={() => openAssignSupplies(room)}>
                            <Package className="mr-1 h-4 w-4" /> Asignar Insumos
                          </Button>
                        )
                      }
                      <Button size="sm" variant="default" onClick={() => handleCompleteCleaning(room)} disabled={completeCleaningMut.isPending}>
                        <CheckCircle className="mr-1 h-4 w-4" /> Completar Limpieza
                      </Button>
                    </div>
                  </>
                )}
                {room.estado === 'mantenimiento' && (
                  <Button size="sm" variant="default" onClick={() => handleChangeStatus(room, 'disponible')}>
                    <CheckCircle className="mr-1 h-4 w-4" /> Marcar Disponible
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!assignRoom} onOpenChange={(v) => { if (!v) { setAssignRoom(null); setSupplyRows([]); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Asignar Insumos - Hab. {assignRoom?.numero}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Estos insumos se descontarán del inventario al completar la limpieza.</p>
            {supplyRows.map((row, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-xs font-medium">Insumo</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                    value={row.supplyItemId}
                    onChange={(e) => updateRow(i, 'supplyItemId', e.target.value)}
                  >
                    <option value="">Seleccionar insumo</option>
                    {filteredSupplies.map((item: any) => (
                      <option key={item.id} value={item.id}>
                        {item.nombre} ({item.stockActual} {item.unidadMedida || 'uds'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="text-xs font-medium">Cantidad</label>
                  <Input type="number" min={1} value={row.cantidad} onChange={(e) => updateRow(i, 'cantidad', Number(e.target.value))} />
                </div>
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeRow(i)} disabled={supplyRows.length === 1}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="mr-1 h-4 w-4" /> Agregar insumo
            </Button>
            <Button
              onClick={handleAssignSupplies}
              disabled={!supplyRows.some((r) => r.supplyItemId && r.cantidad > 0) || assignSuppliesMut.isPending}
              className="w-full"
            >
              Guardar Asignación
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
