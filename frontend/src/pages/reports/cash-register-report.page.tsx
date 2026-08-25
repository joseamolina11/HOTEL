import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api/reports.api';
import { cashRegisterApi } from '@/api/cash-register.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Printer, Loader2, Eye, FileSpreadsheet } from 'lucide-react';
import { formatDateShort, formatDateTime, formatCurrency } from '@/lib/utils';
import { toastSuccess } from '@/lib/notifications';

export function CashRegisterReportPage() {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [selectedRegister, setSelectedRegister] = useState<any>(null);

  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['reports', 'cash-register', desde, hasta],
    queryFn: () => reportsApi.getCashRegisterReport(desde || hasta ? { desde: desde || undefined, hasta: hasta || undefined } : undefined),
    enabled: false,
  });

  const registers = report?.data || [];
  const totals = report?.totals || {};

  const runReport = () => {
    if (!desde && !hasta) {
      alert('Seleccione un rango de fechas');
      return;
    }
    setSelectedRegister(null);
    refetch();
  };

  const downloadCsv = () => {
    const header = ['Fecha Cierre', 'Usuario', 'Efectivo', 'Transferencia', 'Tarjeta', 'Otros', 'Total Ventas', 'Transacciones', 'Diferencia'];
    const rows = registers.map((r: any) => [
      formatDateTime(r.fechaCierre),
      `${r.user?.nombres || ''} ${r.user?.apellidos || ''}`.trim(),
      String(Number(r.totalEfectivo) || 0),
      String(Number(r.totalTransferencia) || 0),
      String(Number(r.totalTarjeta) || 0),
      String(Number(r.totalOtros) || 0),
      String(Number(r.totalVentas) || 0),
      String(r.cantidadTransacciones || 0),
      String(Number(r.diferencia) || 0),
    ]);
    const totalRow = [
      'TOTAL',
      '',
      String(totals.efectivo || 0),
      String(totals.transferencia || 0),
      String(totals.tarjeta || 0),
      String(totals.otros || 0),
      String(totals.totalGeneral || 0),
      String(totals.totalTransacciones || 0),
      '',
    ];
    const csv = [header, ...rows, totalRow]
      .map((row: string[]) => row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-caja-${desde || 'inicio'}-${hasta || 'hoy'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toastSuccess('Reporte descargado');
  };

  const downloadExcel = () => {
    const header = ['Fecha Cierre', 'Usuario', 'Efectivo', 'Transferencia', 'Tarjeta', 'Otros', 'Total Ventas', 'Transacciones', 'Diferencia'];
    const rows: any[][] = registers.map((r: any) => [
      formatDateTime(r.fechaCierre),
      `${r.user?.nombres || ''} ${r.user?.apellidos || ''}`.trim(),
      Number(r.totalEfectivo) || 0,
      Number(r.totalTransferencia) || 0,
      Number(r.totalTarjeta) || 0,
      Number(r.totalOtros) || 0,
      Number(r.totalVentas) || 0,
      r.cantidadTransacciones || 0,
      Number(r.diferencia) || 0,
    ]);
    const totalRow = [
      'TOTAL',
      '',
      totals.efectivo || 0,
      totals.transferencia || 0,
      totals.tarjeta || 0,
      totals.otros || 0,
      totals.totalGeneral || 0,
      totals.totalTransacciones || 0,
      '',
    ];
    const esc = (v: any) => String(v ?? '').replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
    const thead = `<tr>${header.map((h) => `<th style="border:1px solid #999;background:#f1f1f1;font-weight:bold;padding:6px">${esc(h)}</th>`).join('')}</tr>`;
    const tbody = [...rows, totalRow].map((r) => `<tr>${r.map((c) => `<td style="border:1px solid #999;padding:6px">${esc(c)}</td>`).join('')}</tr>`).join('');
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table>${thead}${tbody}</table></body></html>`;
    const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-caja-${desde || 'inicio'}-${hasta || 'hoy'}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toastSuccess('Excel descargado');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleViewDetail = async (register: any) => {
    setSelectedRegister(register);
  };

  return (
    <div className="space-y-6 print-area">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold">Reporte de Caja</h1>
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
          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {report.count} cierre(s) · Total General: <span className="font-semibold text-foreground">{formatCurrency(totals.totalGeneral)}</span>
              <span className="mx-1">·</span>
              Transacciones: <span className="font-semibold text-foreground">{totals.totalTransacciones}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={downloadCsv} disabled={registers.length === 0}>
                <Download className="mr-1 h-4 w-4" /> Descargar
              </Button>
              <Button variant="outline" size="sm" onClick={downloadExcel} disabled={registers.length === 0}>
                <FileSpreadsheet className="mr-1 h-4 w-4" /> Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} disabled={registers.length === 0}>
                <Printer className="mr-1 h-4 w-4" /> Imprimir
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Totales por Método de Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="rounded-lg bg-green-50 p-4 border border-green-200 text-center">
                  <p className="text-xs text-green-700 font-medium uppercase tracking-wider">Efectivo</p>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(totals.efectivo)}</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-4 border border-blue-200 text-center">
                  <p className="text-xs text-blue-700 font-medium uppercase tracking-wider">Transferencia</p>
                  <p className="text-2xl font-bold text-blue-700">{formatCurrency(totals.transferencia)}</p>
                </div>
                <div className="rounded-lg bg-purple-50 p-4 border border-purple-200 text-center">
                  <p className="text-xs text-purple-700 font-medium uppercase tracking-wider">Tarjeta</p>
                  <p className="text-2xl font-bold text-purple-700">{formatCurrency(totals.tarjeta)}</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-4 border border-amber-200 text-center">
                  <p className="text-xs text-amber-700 font-medium uppercase tracking-wider">Otros</p>
                  <p className="text-2xl font-bold text-amber-700">{formatCurrency(totals.otros)}</p>
                </div>
                <div className="rounded-lg bg-gray-100 p-4 border border-gray-200 text-center">
                  <p className="text-xs text-gray-700 font-medium uppercase tracking-wider">Total General</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.totalGeneral)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Fecha Cierre</th>
                      <th className="px-4 py-3 text-left font-medium">Usuario</th>
                      <th className="px-4 py-3 text-right font-medium">Efectivo</th>
                      <th className="px-4 py-3 text-right font-medium">Transferencia</th>
                      <th className="px-4 py-3 text-right font-medium">Tarjeta</th>
                      <th className="px-4 py-3 text-right font-medium">Otros</th>
                      <th className="px-4 py-3 text-right font-medium">Total Ventas</th>
                      <th className="px-4 py-3 text-center font-medium">Trans.</th>
                      <th className="px-4 py-3 text-center font-medium">Diferencia</th>
                      <th className="px-4 py-3 text-center font-medium">Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registers.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">
                          Sin cierres de caja en el rango seleccionado
                        </td>
                      </tr>
                    ) : (
                      registers.map((r: any) => (
                        <tr key={r.id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => handleViewDetail(r)}>
                          <td className="px-4 py-3">{formatDateTime(r.fechaCierre)}</td>
                          <td className="px-4 py-3 font-medium">
                            {r.user?.nombres} {r.user?.apellidos}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-green-700">
                            {formatCurrency(r.totalEfectivo)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-blue-700">
                            {formatCurrency(r.totalTransferencia)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-purple-700">
                            {formatCurrency(r.totalTarjeta)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-amber-700">
                            {formatCurrency(r.totalOtros)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold">
                            {formatCurrency(r.totalVentas)}
                          </td>
                          <td className="px-4 py-3 text-center">{r.cantidadTransacciones}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={Number(r.diferencia) === 0 ? 'success' : 'destructive'}>
                              {formatCurrency(r.diferencia || 0)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleViewDetail(r); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">TOTAL</th>
                      <th className="px-4 py-3"></th>
                      <th className="px-4 py-3 text-right font-medium text-green-700">{formatCurrency(totals.efectivo)}</th>
                      <th className="px-4 py-3 text-right font-medium text-blue-700">{formatCurrency(totals.transferencia)}</th>
                      <th className="px-4 py-3 text-right font-medium text-purple-700">{formatCurrency(totals.tarjeta)}</th>
                      <th className="px-4 py-3 text-right font-medium text-amber-700">{formatCurrency(totals.otros)}</th>
                      <th className="px-4 py-3 text-right font-bold">{formatCurrency(totals.totalGeneral)}</th>
                      <th className="px-4 py-3 text-center font-medium">{totals.totalTransacciones}</th>
                      <th className="px-4 py-3"></th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="hidden print:block text-xs mt-4">
            <p>Generado el {new Date().toLocaleDateString()} · Rango: {desde || 'inicio'} a {hasta || 'hoy'}</p>
          </div>
        </>
      )}

      <CashRegisterDetailDialog
        register={selectedRegister}
        onClose={() => setSelectedRegister(null)}
      />
    </div>
  );
}

function CashRegisterDetailDialog({ register, onClose }: { register: any; onClose: () => void }) {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [movPage, setMovPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMovements = async (page = 1) => {
    if (!register) return;
    setLoading(true);
    try {
      const data = await cashRegisterApi.findMovements(register.id, {
        page: String(page),
        limit: '50',
      });
      setMovements(data.movements.data || []);
      setTotalPages(data.movements.totalPages || 1);
    } catch (error) {
      console.error('Error fetching movements:', error);
    } finally {
      setLoading(false);
    }
  };

  useMemo(() => {
    if (register) {
      fetchMovements(1);
    }
  }, [register]);

  if (!register) return null;

  const ingresos = movements.filter((m) => m.tipo === 'INGRESO');
  const egresos = movements.filter((m) => m.tipo === 'EGRESO');
  const totalIngresos = ingresos.reduce((sum, m) => sum + Number(m.monto || 0), 0);
  const totalEgresos = egresos.reduce((sum, m) => sum + Number(m.monto || 0), 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-semibold">Detalle de Caja - {formatDateTime(register.fechaCierre)}</h2>
            <p className="text-sm text-muted-foreground">
              Usuario: {register.user?.nombres} {register.user?.apellidos} · Diferencia: {formatCurrency(register.diferencia || 0)}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <span className="text-2xl leading-none">×</span>
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Monto Inicial</p>
              <p className="font-bold">{formatCurrency(register.montoInicial)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total Ventas</p>
              <p className="font-bold">{formatCurrency(register.totalVentas)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Transacciones</p>
              <p className="font-bold">{register.cantidadTransacciones}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Diferencia</p>
              <p className={`font-bold ${Number(register.diferencia) !== 0 ? 'text-destructive' : 'text-green-700'}`}>
                {formatCurrency(register.diferencia || 0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center border-r border-b md:border-r-0 md:border-b-0 last:border-r-0">
              <p className="text-xs text-green-700 font-medium">Total Ingresos</p>
              <p className="text-lg font-bold text-green-700">{formatCurrency(totalIngresos)}</p>
              <p className="text-xs text-muted-foreground">{ingresos.length} movimientos</p>
            </div>
            <div className="text-center border-b md:border-b-0 last:border-r-0">
              <p className="text-xs text-red-700 font-medium">Total Egresos</p>
              <p className="text-lg font-bold text-red-700">{formatCurrency(totalEgresos)}</p>
              <p className="text-xs text-muted-foreground">{egresos.length} movimientos</p>
            </div>
            <div className="text-center border-b md:border-b-0 last:border-r-0">
              <p className="text-xs text-blue-700 font-medium">Netos (Ing - Egr)</p>
              <p className="text-lg font-bold text-blue-700">{formatCurrency(totalIngresos - totalEgresos)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total Movimientos</p>
              <p className="text-lg font-bold">{movements.length}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Movimientos del Turno</h3>
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
                    <th className="px-3 py-2 text-left font-medium">Referencia</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Cargando...</td></tr>
                  ) : movements.length === 0 ? (
                    <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Sin movimientos registrados</td></tr>
                  ) : (
                    movements.map((m: any) => {
                      const isIngreso = m.tipo === 'INGRESO';
                      const isEgreso = m.tipo === 'EGRESO';
                      const isTransferIn = m.tipo === 'TRANSFERENCIA_ENTRADA';
                      const isTransferOut = m.tipo === 'TRANSFERENCIA_SALIDA';
                      const isAjuste = m.tipo === 'AJUSTE';

                      let badgeClass = 'text-gray-600 bg-gray-50 border-gray-200';
                      let sign = '';
                      if (isIngreso) { badgeClass = 'text-green-600 bg-green-50 border-green-200'; sign = '+'; }
                      else if (isEgreso) { badgeClass = 'text-red-600 bg-red-50 border-red-200'; sign = '-'; }
                      else if (isTransferIn) { badgeClass = 'text-blue-600 bg-blue-50 border-blue-200'; sign = '+'; }
                      else if (isTransferOut) { badgeClass = 'text-orange-600 bg-orange-50 border-orange-200'; sign = '-'; }
                      else if (isAjuste) { badgeClass = 'text-purple-600 bg-purple-50 border-purple-200'; }

                      return (
                        <tr key={m.id} className="border-b hover:bg-muted/50">
                          <td className="px-3 py-2 text-muted-foreground text-xs">{formatDateTime(m.fechaMovimiento)}</td>
                          <td className="px-3 py-2">
                            <Badge variant="outline" className={badgeClass}>{m.tipo}</Badge>
                          </td>
                          <td className="px-3 py-2 max-w-[250px] truncate">{m.concepto || '—'}</td>
                          <td className={`px-3 py-2 text-right font-mono font-bold ${isIngreso || isTransferIn ? 'text-green-700' : isEgreso || isTransferOut ? 'text-red-700' : ''}`}>
                            {sign}{formatCurrency(m.monto)}
                          </td>
                          <td className="px-3 py-2">{m.account?.nombre || '—'}</td>
                          <td className="px-3 py-2">{m.user?.nombres ? `${m.user.nombres} ${m.user.apellidos || ''}` : '—'}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {m.referenciaTipo && m.referenciaId && `${m.referenciaTipo}:${m.referenciaId}`}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchMovements(movPage - 1)}
                  disabled={movPage === 1 || loading}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">Página {movPage} de {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchMovements(movPage + 1)}
                  disabled={movPage === totalPages || loading}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}