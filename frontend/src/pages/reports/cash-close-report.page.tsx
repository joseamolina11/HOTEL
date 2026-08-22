import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api/reports.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Loader2, Eye, Download, Printer, FileSpreadsheet, ArrowUpRight, ArrowDownRight, ArrowLeftRight } from 'lucide-react';
import { formatDateShort, formatDateTime, formatCurrency } from '@/lib/utils';
import { toastSuccess } from '@/lib/notifications';

const METHOD_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  otros: 'Otros',
};

const MOVEMENT_TYPE_INFO: Record<string, { label: string; icon: any; color: string; textColor: string; sign: string }> = {
  INGRESO: { label: 'Ingreso', icon: ArrowUpRight, color: 'text-green-600 bg-green-50 border-green-200', textColor: 'text-green-600', sign: '+' },
  EGRESO: { label: 'Egreso', icon: ArrowDownRight, color: 'text-red-600 bg-red-50 border-red-200', textColor: 'text-red-600', sign: '-' },
  TRANSFERENCIA_ENTRADA: { label: 'Transferencia Entrada', icon: ArrowLeftRight, color: 'text-blue-600 bg-blue-50 border-blue-200', textColor: 'text-blue-600', sign: '+' },
  TRANSFERENCIA_SALIDA: { label: 'Transferencia Salida', icon: ArrowLeftRight, color: 'text-orange-600 bg-orange-50 border-orange-200', textColor: 'text-orange-600', sign: '-' },
};

export function CashCloseReportPage() {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['reports', 'cash-close', desde, hasta],
    queryFn: () => reportsApi.getCashCloseReport(desde || hasta ? { desde: desde || undefined, hasta: hasta || undefined } : undefined),
    enabled: false,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['reports', 'cash-close', 'detail', detailId],
    queryFn: () => reportsApi.getCashCloseDetail(detailId!),
    enabled: !!detailId,
  });

  const closures = report?.data || [];
  const totals = report?.totals || {};

  const runReport = () => {
    if (!desde && !hasta) {
      alert('Seleccione un rango de fechas');
      return;
    }
    refetch();
  };

  const downloadCsv = () => {
    const header = ['Usuario', 'Apertura', 'Cierre', 'Ventas', 'Efectivo', 'Transferencia', 'Tarjeta', 'Otros', 'Total', 'Transacciones'];
    const rows = closures.map((r: any) => [
      r.user ? `${r.user.nombres} ${r.user.apellidos}` : '',
      formatDateTime(r.fechaApertura),
      r.fechaCierre ? formatDateTime(r.fechaCierre) : '',
      String(Number(r.totalVentas) || 0),
      String(Number(r.totalEfectivo) || 0),
      String(Number(r.totalTransferencia) || 0),
      String(Number(r.totalTarjeta) || 0),
      String(Number(r.totalOtros) || 0),
      String(Number(r.totalVentas) || 0),
      String(r.cantidadTransacciones ?? 0),
    ]);
    const csv = [header, ...rows]
      .map((row: string[]) => row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-cierre-caja-${desde || 'inicio'}-${hasta || 'hoy'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toastSuccess('Reporte descargado');
  };

  const downloadExcel = () => {
    const header = ['Usuario', 'Apertura', 'Cierre', 'Ventas', 'Efectivo', 'Transferencia', 'Tarjeta', 'Otros', 'Total', 'Transacciones'];
    const rows: any[][] = closures.map((r: any) => [
      r.user ? `${r.user.nombres} ${r.user.apellidos}` : '',
      formatDateTime(r.fechaApertura),
      r.fechaCierre ? formatDateTime(r.fechaCierre) : '',
      Number(r.totalVentas) || 0,
      Number(r.totalEfectivo) || 0,
      Number(r.totalTransferencia) || 0,
      Number(r.totalTarjeta) || 0,
      Number(r.totalOtros) || 0,
      Number(r.totalVentas) || 0,
      r.cantidadTransacciones ?? 0,
    ]);
    const esc = (v: any) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const thead = `<tr>${header.map((h) => `<th style="border:1px solid #999;background:#f1f1f1;font-weight:bold;padding:6px">${esc(h)}</th>`).join('')}</tr>`;
    const tbody = rows.map((r) => `<tr>${r.map((c) => `<td style="border:1px solid #999;padding:6px">${esc(c)}</td>`).join('')}</tr>`).join('');
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table>${thead}${tbody}</table></body></html>`;
    const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-cierre-caja-${desde || 'inicio'}-${hasta || 'hoy'}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toastSuccess('Excel descargado');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print-area">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold">Historial de Cierre de Caja</h1>
      </div>

      <Card className="print:hidden">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Desde</label>
              <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Hasta</label>
              <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
            <Button onClick={runReport} className="min-w-28">Generar</Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando reporte...
        </div>
      )}

      {!isLoading && report && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {['efectivo', 'transferencia', 'tarjeta', 'otros'].map((m) => (
              <div key={m} className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">{METHOD_LABELS[m]}</p>
                <p className="text-lg font-bold">{formatCurrency(Number(totals?.[m]) || 0)}</p>
              </div>
            ))}
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
              <p className="text-xs text-primary font-medium">Total declarado</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(Number(report?.total) || 0)}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {report.count} cierre(s) · Ventas: <span className="font-semibold text-foreground">{formatCurrency(Number(totals?.ventas) || 0)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={downloadCsv} disabled={closures.length === 0}>
                <Download className="mr-1 h-4 w-4" /> Descargar
              </Button>
              <Button variant="outline" size="sm" onClick={downloadExcel} disabled={closures.length === 0}>
                <FileSpreadsheet className="mr-1 h-4 w-4" /> Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} disabled={closures.length === 0}>
                <Printer className="mr-1 h-4 w-4" /> Imprimir
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-medium">Usuario</th>
                      <th className="px-4 py-3 text-left font-medium">Apertura</th>
                      <th className="px-4 py-3 text-left font-medium">Cierre</th>
                      <th className="px-4 py-3 text-right font-medium">Efectivo</th>
                      <th className="px-4 py-3 text-right font-medium">Transferencia</th>
                      <th className="px-4 py-3 text-right font-medium">Tarjeta</th>
                      <th className="px-4 py-3 text-right font-medium">Otros</th>
                      <th className="px-4 py-3 text-right font-medium">Total</th>
                      <th className="px-4 py-3 text-center font-medium">Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {closures.length === 0 ? (
                      <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">Sin cierres de caja en el rango seleccionado</td></tr>
                    ) : (
                      closures.map((r: any) => (
                        <tr key={r.id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => setDetailId(r.id)}>
                          <td className="px-4 py-3">{r.user?.nombres} {r.user?.apellidos || '—'}</td>
                          <td className="px-4 py-3 text-muted-foreground">{formatDateTime(r.fechaApertura)}</td>
                          <td className="px-4 py-3 text-muted-foreground">{r.fechaCierre ? formatDateTime(r.fechaCierre) : '—'}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(Number(r.totalEfectivo))}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(Number(r.totalTransferencia))}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(Number(r.totalTarjeta))}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(Number(r.totalOtros))}</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatCurrency(Number(r.totalVentas))}</td>
                          <td className="px-4 py-3 text-center">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDetailId(r.id); }}>
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

          <div className="hidden print:block text-xs mt-4">
            <p>Generado el {new Date().toLocaleDateString()} · Rango: {desde || 'inicio'} a {hasta || 'hoy'}</p>
          </div>
        </>
      )}

      <CloseDetailDialog
        detail={detail}
        loading={detailLoading}
        open={!!detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}

function CloseDetailDialog({ detail, loading, open, onClose }: {
  detail: any;
  loading: boolean;
  open: boolean;
  onClose: () => void;
}) {
  const register = detail?.register;
  const summary = detail?.summary;
  const movements = detail?.movements || [];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle de Cierre de Caja</DialogTitle>
        </DialogHeader>
        {loading || !register ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando detalle...
          </div>
        ) : (
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
              <h4 className="text-sm font-medium mb-2">Montos por método de pago</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Efectivo</p>
                  <p className="text-base font-bold">{formatCurrency(Number(register.totalEfectivo))}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Transferencia</p>
                  <p className="text-base font-bold">{formatCurrency(Number(register.totalTransferencia))}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Tarjeta</p>
                  <p className="text-base font-bold">{formatCurrency(Number(register.totalTarjeta))}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Otros</p>
                  <p className="text-base font-bold">{formatCurrency(Number(register.totalOtros))}</p>
                </div>
              </div>

              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Monto Inicial</span><span>{formatCurrency(Number(register.montoInicial))}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Ingresos en efectivo</span><span>{formatCurrency(Number(summary?.methods?.efectivo?.ingresos) || 0)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Egresos</span><span>{formatCurrency(Number(summary?.methods?.efectivo?.egresos) || 0)}</span></div>
                <div className="flex justify-between border-t pt-1"><span className="text-muted-foreground">Total Ventas</span><span className="font-bold">{formatCurrency(Number(register.totalVentas))}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Diferencia</span><span className={Number(register.diferencia) !== 0 ? 'text-destructive font-bold' : ''}>{formatCurrency(Number(register.diferencia) || 0)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Transacciones</span><span className="font-medium">{register.cantidadTransacciones}</span></div>
              </div>
              {register.observaciones && (
                <p className="mt-2 text-sm"><span className="text-muted-foreground">Observaciones: </span>{register.observaciones}</p>
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Movimientos del Turno</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-3 py-2 text-left font-medium">Fecha</th>
                      <th className="px-3 py-2 text-left font-medium">Tipo</th>
                      <th className="px-3 py-2 text-left font-medium">Concepto</th>
                      <th className="px-3 py-2 text-right font-medium">Monto</th>
                      <th className="px-3 py-2 text-left font-medium">Cuenta</th>
                      <th className="px-3 py-2 text-left font-medium">Usuario</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b bg-muted/30">
                      <td className="px-3 py-2 text-muted-foreground text-xs">{formatDateTime(register.fechaApertura)}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="text-teal-600 bg-teal-50 border-teal-200">Apertura</Badge>
                      </td>
                      <td className="px-3 py-2">Apertura de turno{register.observaciones ? ` - ${register.observaciones}` : ''}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-teal-600">+{formatCurrency(Number(register.montoInicial))}</td>
                      <td className="px-3 py-2">{register.account?.nombre || '—'}</td>
                      <td className="px-3 py-2">{register.user?.nombres} {register.user?.apellidos}</td>
                    </tr>
                    {movements.length === 0 ? (
                      <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Sin movimientos registrados</td></tr>
                    ) : (
                      movements.map((m: any) => {
                        const info = MOVEMENT_TYPE_INFO[m.tipo] || MOVEMENT_TYPE_INFO.EGRESO;
                        return (
                          <tr key={m.id} className="border-b hover:bg-muted/50">
                            <td className="px-3 py-2 text-muted-foreground text-xs">{formatDateTime(m.fechaMovimiento)}</td>
                            <td className="px-3 py-2">
                              <Badge variant="outline" className={info.color}>
                                <info.icon className="h-3 w-3 mr-1" /> {info.label}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 max-w-[250px] truncate">{m.concepto || '—'}</td>
                            <td className={`px-3 py-2 text-right font-mono font-bold ${info.textColor}`}>
                              {info.sign}{formatCurrency(Number(m.monto))}
                            </td>
                            <td className="px-3 py-2">{m.account?.nombre || '—'}</td>
                            <td className="px-3 py-2">{m.user?.nombres ? `${m.user.nombres} ${m.user.apellidos || ''}` : '—'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <DialogClose asChild>
                <Button variant="outline">Cerrar</Button>
              </DialogClose>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}