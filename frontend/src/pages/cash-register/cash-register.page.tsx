import { useState } from 'react';
import { useOpenCashRegister, useCashRegisters, useOpenNewCashRegister, useCloseCashRegister } from '@/hooks/useCashRegister';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { Loader2, Eye } from 'lucide-react';
import { toastSuccess } from '@/lib/notifications';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export function CashRegisterPage() {
  const { data: openRegister, isLoading: openLoading } = useOpenCashRegister();
  const [page, setPage] = useState(1);
  const { data: history, isLoading: historyLoading } = useCashRegisters(page);
  const historyList = history?.data?.data || [];
  const totalPages = history?.data?.totalPages || 1;
  const [showOpen, setShowOpen] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cierre de Caja</h1>
        {!openRegister && (
          <Button onClick={() => setShowOpen(true)}>
            <CashRegisterIcon className="mr-2 h-4 w-4" /> Abrir Caja
          </Button>
        )}
      </div>

      {openRegister && (
        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Caja Abierta</CardTitle>
              <p className="text-sm text-muted-foreground">
                Abierta por {openRegister.user?.nombres} {openRegister.user?.apellidos} el {formatDateTime(openRegister.fechaApertura)}
              </p>
            </div>
            <Badge variant="success" className="text-sm">Abierta</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Monto Inicial</p>
                <p className="text-lg font-bold">{formatCurrency(openRegister.montoInicial)}</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Total Ventas</p>
                <p className="text-lg font-bold">{formatCurrency(openRegister.totalVentas)}</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Transacciones</p>
                <p className="text-lg font-bold">{openRegister.cantidadTransacciones}</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Tiempo</p>
                <p className="text-lg font-bold">
                  {Math.floor((Date.now() - new Date(openRegister.fechaApertura).getTime()) / 3600000)}h
                </p>
              </div>
            </div>
            <Button variant="destructive" onClick={() => setShowClose(true)}>
              Cerrar Caja
            </Button>
          </CardContent>
        </Card>
      )}

      {!openRegister && !openLoading && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No hay una caja abierta actualmente
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Historial de Cierres</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Usuario</th>
                  <th className="px-4 py-3 text-left font-medium">Apertura</th>
                  <th className="px-4 py-3 text-left font-medium">Cierre</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-right font-medium">Trans.</th>
                  <th className="px-4 py-3 text-center font-medium">Estado</th>
                  <th className="px-4 py-3 text-center font-medium">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                ) : historyList.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Sin cierres registrados</td></tr>
                ) : (
                  historyList.map((reg: any) => (
                    <tr key={reg.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3">{reg.user?.nombres} {reg.user?.apellidos}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(reg.fechaApertura)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{reg.fechaCierre ? formatDateTime(reg.fechaCierre) : '—'}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(reg.totalVentas)}</td>
                      <td className="px-4 py-3 text-right">{reg.cantidadTransacciones}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={reg.estado === 'abierta' ? 'warning' : 'success'}>
                          {reg.estado}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button variant="ghost" size="icon" onClick={() => setShowDetail(reg)}>
                          <Eye className="h-4 w-4" />
                        </Button>
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

      <OpenDialog open={showOpen} onClose={() => setShowOpen(false)} />
      <CloseDialog open={showClose} onClose={() => setShowClose(false)} register={openRegister} />
      <DetailDialog register={showDetail} onClose={() => setShowDetail(null)} />
    </div>
  );
}

function OpenDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [montoInicial, setMontoInicial] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const openMut = useOpenNewCashRegister();

  const handleSubmit = async () => {
    await openMut.mutateAsync({
      montoInicial: Number(montoInicial),
      observaciones: observaciones || undefined,
    });
    toastSuccess('Caja abierta');
    setMontoInicial('');
    setObservaciones('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Abrir Caja</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Monto Inicial</label>
            <Input type="number" step="0.01" min={0} value={montoInicial} onChange={(e) => setMontoInicial(e.target.value)} placeholder="0.00" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Observaciones</label>
            <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Opcional" />
          </div>
          <Button className="w-full" disabled={!montoInicial || openMut.isPending} onClick={handleSubmit}>
            {openMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Abrir Caja
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CloseDialog({ open, onClose, register }: { open: boolean; onClose: () => void; register: any }) {
  const [totalEfectivo, setTotalEfectivo] = useState('');
  const [totalTransferencia, setTotalTransferencia] = useState('');
  const [totalTarjeta, setTotalTarjeta] = useState('');
  const [totalOtros, setTotalOtros] = useState('');
  const [cantidadTransacciones, setCantidadTransacciones] = useState('');
  const [diferencia, setDiferencia] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [autoCalc, setAutoCalc] = useState(true);

  const closeMut = useCloseCashRegister();

  if (!register) return null;

  const totalDeclarado = (Number(totalEfectivo) || 0) + (Number(totalTransferencia) || 0) + (Number(totalTarjeta) || 0) + (Number(totalOtros) || 0);
  const diff = autoCalc ? totalDeclarado - Number(register.totalVentas) : (Number(diferencia) || 0);

  const handleSubmit = async () => {
    await closeMut.mutateAsync({
      id: register.id,
      dto: {
        totalEfectivo: Number(totalEfectivo) || 0,
        totalTransferencia: Number(totalTransferencia) || 0,
        totalTarjeta: Number(totalTarjeta) || 0,
        totalOtros: Number(totalOtros) || 0,
        cantidadTransacciones: Number(cantidadTransacciones) || 0,
        diferencia: diff,
        observaciones: observaciones || undefined,
      },
    });
    toastSuccess('Caja cerrada');
    setTotalEfectivo('');
    setTotalTransferencia('');
    setTotalTarjeta('');
    setTotalOtros('');
    setCantidadTransacciones('');
    setDiferencia('');
    setObservaciones('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cerrar Caja</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p><span className="text-muted-foreground">Total ventas registrado: </span>
              <span className="font-bold">{formatCurrency(register.totalVentas)}</span></p>
            <p><span className="text-muted-foreground">Monto inicial: </span>
              <span className="font-bold">{formatCurrency(register.montoInicial)}</span></p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Efectivo</label>
              <Input type="number" step="0.01" min={0} value={totalEfectivo} onChange={(e) => setTotalEfectivo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Transferencia</label>
              <Input type="number" step="0.01" min={0} value={totalTransferencia} onChange={(e) => setTotalTransferencia(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tarjeta</label>
              <Input type="number" step="0.01" min={0} value={totalTarjeta} onChange={(e) => setTotalTarjeta(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Otros</label>
              <Input type="number" step="0.01" min={0} value={totalOtros} onChange={(e) => setTotalOtros(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Cantidad de Transacciones</label>
            <Input type="number" min={0} value={cantidadTransacciones} onChange={(e) => setCantidadTransacciones(e.target.value)} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Diferencia</label>
              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={autoCalc} onChange={(e) => setAutoCalc(e.target.checked)} />
                Auto
              </label>
            </div>
            {autoCalc ? (
              <div className="rounded-lg border p-2 text-sm">
                Declarado: {formatCurrency(totalDeclarado)} - Sistema: {formatCurrency(register.totalVentas)} ={' '}
                <span className={diff !== 0 ? 'text-destructive font-bold' : 'font-bold'}>{formatCurrency(diff)}</span>
              </div>
            ) : (
              <Input type="number" step="0.01" value={diferencia} onChange={(e) => setDiferencia(e.target.value)} />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Observaciones</label>
            <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Opcional" />
          </div>

          <Button className="w-full" disabled={closeMut.isPending} onClick={handleSubmit}>
            {closeMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Cerrar Caja
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailDialog({ register, onClose }: { register: any; onClose: () => void }) {
  if (!register) return null;

  return (
    <Dialog open={!!register} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle de Caja</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Usuario</p>
              <p className="font-medium">{register.user?.nombres} {register.user?.apellidos}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Estado</p>
              <Badge variant={register.estado === 'abierta' ? 'warning' : 'success'}>{register.estado}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Apertura</p>
              <p className="font-medium">{formatDateTime(register.fechaApertura)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cierre</p>
              <p className="font-medium">{register.fechaCierre ? formatDateTime(register.fechaCierre) : '—'}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Montos</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Monto Inicial</span><span>{formatCurrency(register.montoInicial)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Ventas</span><span className="font-bold">{formatCurrency(register.totalVentas)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Efectivo</span><span>{formatCurrency(register.totalEfectivo)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Transferencia</span><span>{formatCurrency(register.totalTransferencia)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tarjeta</span><span>{formatCurrency(register.totalTarjeta)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Otros</span><span>{formatCurrency(register.totalOtros)}</span></div>
              <div className="flex justify-between border-t pt-1"><span className="text-muted-foreground">Diferencia</span><span className={Number(register.diferencia) !== 0 ? 'text-destructive font-bold' : ''}>{formatCurrency(register.diferencia || 0)}</span></div>
            </div>
          </div>

          <div className="border-t pt-4 text-sm">
            <p><span className="text-muted-foreground">Transacciones: </span><span className="font-medium">{register.cantidadTransacciones}</span></p>
          </div>

          {register.observaciones && (
            <div className="text-sm">
              <span className="text-muted-foreground">Observaciones: </span>
              <span>{register.observaciones}</span>
            </div>
          )}

          <div className="flex justify-end">
            <DialogClose asChild>
              <Button variant="outline">Cerrar</Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CashRegisterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M6 8h12M6 12h12M6 16h6" />
    </svg>
  );
}
