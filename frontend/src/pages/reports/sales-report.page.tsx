import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api/reports.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Printer, Loader2, FileSpreadsheet, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDateShort, formatDateTime, formatCurrency } from '@/lib/utils';
import { toastSuccess } from '@/lib/notifications';

export function SalesReportPage() {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['reports', 'sales', desde, hasta],
    queryFn: () => reportsApi.getSalesReport(desde || hasta ? { desde: desde || undefined, hasta: hasta || undefined } : undefined),
    enabled: false,
  });

  const movements = report?.movements || [];
  const payments = report?.payments || [];
  const methodTotals = report?.methodTotals || {};
  const totalVentas = report?.totalVentas || 0;
  const totalCount = report?.totalCount || 0;

  const runReport = () => {
    if (!desde && !hasta) {
      alert('Seleccione un rango de fechas');
      return;
    }
    setExpandedRows(new Set());
    refetch();
  };

  const downloadCsv = () => {
    const header = ['Fecha', 'Concepto', 'Método', 'Monto', 'Usuario', 'Reserva', 'Huésped', 'Habitación', 'Origen'];
    const rows = [...movements, ...payments].map((item: any) => {
      const fecha = item.fechaMovimiento ? formatDateTime(item.fechaMovimiento) : formatDateShort(item.fecha);
      const concepto = item.concepto || item.observaciones || '—';
      const metodo = item.account?.nombre || item.metodoPago?.nombre || '—';
      const monto = Number(item.monto) || 0;
      const usuario = item.user?.nombres ? `${item.user.nombres} ${item.user.apellidos || ''}` : '—';
      const reserva = item.reservation?.codigo || '—';
      const huesped = item.reservation?.guest ? `${item.reservation.guest.nombres} ${item.reservation.guest.apellidos}` : '—';
      const habitacion = item.reservation?.room?.nombre || '—';
      const origen = item.fechaMovimiento ? 'Movimiento' : 'Pago';
      return [fecha, concepto, metodo, String(monto), usuario, reserva, huesped, habitacion, origen];
    });
    const totalRow = ['TOTAL', '', '', String(totalVentas), '', '', '', '', ''];
    const csv = [header, ...rows, totalRow]
      .map((row: string[]) => row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-ventas-${desde || 'inicio'}-${hasta || 'hoy'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toastSuccess('Reporte descargado');
  };

  const downloadExcel = () => {
    const header = ['Fecha', 'Concepto', 'Método', 'Monto', 'Usuario', 'Reserva', 'Huésped', 'Habitación', 'Origen'];
    const rows: any[][] = [...movements, ...payments].map((item: any) => {
      const fecha = item.fechaMovimiento ? formatDateTime(item.fechaMovimiento) : formatDateShort(item.fecha);
      const concepto = item.concepto || item.observaciones || '—';
      const metodo = item.account?.nombre || item.metodoPago?.nombre || '—';
      const monto = Number(item.monto) || 0;
      const usuario = item.user?.nombres ? `${item.user.nombres} ${item.user.apellidos || ''}` : '—';
      const reserva = item.reservation?.codigo || '—';
      const huesped = item.reservation?.guest ? `${item.reservation.guest.nombres} ${item.reservation.guest.apellidos}` : '—';
      const habitacion = item.reservation?.room?.nombre || '—';
      const origen = item.fechaMovimiento ? 'Movimiento' : 'Pago';
      return [fecha, concepto, metodo, monto, usuario, reserva, huesped, habitacion, origen];
    });
    const totalRow = ['TOTAL', '', '', totalVentas, '', '', '', '', ''];
    const esc = (v: any) => String(v ?? '').replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
    const thead = `<tr>${header.map((h) => `<th style="border:1px solid #999;background:#f1f1f1;font-weight:bold;padding:6px">${esc(h)}</th>`).join('')}</tr>`;
    const tbody = [...rows, totalRow].map((r) => `<tr>${r.map((c) => `<td style="border:1px solid #999;padding:6px">${esc(c)}</td>`).join('')}</tr>`).join('');
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table>${thead}${tbody}</table></body></html>`;
    const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-ventas-${desde || 'inicio'}-${hasta || 'hoy'}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toastSuccess('Excel descargado');
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6 print-area">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold">Reporte de Ventas (Ingresos)</h1>
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
              {totalCount} registro(s) · Total Ventas: <span className="font-semibold text-foreground">{formatCurrency(totalVentas)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={downloadCsv} disabled={totalCount === 0}>
                <Download className="mr-1 h-4 w-4" /> Descargar
              </Button>
              <Button variant="outline" size="sm" onClick={downloadExcel} disabled={totalCount === 0}>
                <FileSpreadsheet className="mr-1 h-4 w-4" /> Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} disabled={totalCount === 0}>
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
                {Object.entries(methodTotals).map(([method, data]: [string, any]) => (
                  <div key={method} className="rounded-lg bg-green-50 p-4 border border-green-200 text-center">
                    <p className="text-xs text-green-700 font-medium uppercase tracking-wider">{method.charAt(0).toUpperCase() + method.slice(1)}</p>
                    <p className="text-2xl font-bold text-green-700">{formatCurrency(data.ingresos)}</p>
                    <p className="text-xs text-muted-foreground">{data.count} transacciones</p>
                  </div>
                ))}
                <div className="rounded-lg bg-gray-100 p-4 border border-gray-200 text-center">
                  <p className="text-xs text-gray-700 font-medium uppercase tracking-wider">Total General</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalVentas)}</p>
                  <p className="text-xs text-muted-foreground">{totalCount} transacciones</p>
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
                      <th className="px-4 py-3 text-left font-medium">Fecha</th>
                      <th className="px-4 py-3 text-left font-medium">Concepto</th>
                      <th className="px-4 py-3 text-left font-medium">Método</th>
                      <th className="px-4 py-3 text-right font-medium">Monto</th>
                      <th className="px-4 py-3 text-left font-medium">Usuario</th>
                      <th className="px-4 py-3 text-left font-medium">Reserva</th>
                      <th className="px-4 py-3 text-left font-medium">Huésped</th>
                      <th className="px-4 py-3 text-left font-medium">Habitación</th>
                      <th className="px-4 py-3 text-center font-medium">Origen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {totalCount === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                          Sin ventas en el rango seleccionado
                        </td>
                      </tr>
                    ) : (
                      [...movements, ...payments].map((item: any) => {
                        const id = item.id;
                        const isExpanded = expandedRows.has(id);
                        const fecha = item.fechaMovimiento ? formatDateTime(item.fechaMovimiento) : formatDateShort(item.fecha);
                        const concepto = item.concepto || item.observaciones || '—';
                        const metodo = item.account?.nombre || item.metodoPago?.nombre || '—';
                        const monto = Number(item.monto) || 0;
                        const usuario = item.user?.nombres ? `${item.user.nombres} ${item.user.apellidos || ''}` : '—';
                        const reserva = item.reservation?.codigo || '—';
                        const huesped = item.reservation?.guest ? `${item.reservation.guest.nombres} ${item.reservation.guest.apellidos}` : '—';
                        const habitacion = item.reservation?.room?.nombre || '—';
                        const origen = item.fechaMovimiento ? 'Movimiento' : 'Pago';

                        return (
                          <tr key={id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => toggleExpand(id)}>
                            <td className="px-4 py-3">{fecha}</td>
                            <td className="px-4 py-3 max-w-[200px] truncate">{concepto}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline">{metodo}</Badge>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-green-700">{formatCurrency(monto)}</td>
                            <td className="px-4 py-3">{usuario}</td>
                            <td className="px-4 py-3">{reserva}</td>
                            <td className="px-4 py-3">{huesped}</td>
                            <td className="px-4 py-3">{habitacion}</td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant="secondary" className="text-xs">{origen}</Badge>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">TOTAL</th>
                      <th className="px-4 py-3"></th>
                      <th className="px-4 py-3"></th>
                      <th className="px-4 py-3 text-right font-bold text-green-700">{formatCurrency(totalVentas)}</th>
                      <th className="px-4 py-3" colSpan={5}></th>
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
    </div>
  );
}