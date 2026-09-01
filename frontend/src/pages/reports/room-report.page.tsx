import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api/reports.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Printer, Loader2, FileSpreadsheet, BedDouble, Utensils, Tag, ShoppingCart } from 'lucide-react';
import { formatDateShort, formatCurrency } from '@/lib/utils';
import { toastSuccess } from '@/lib/notifications';

export function RoomReportPage() {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['reports', 'rooms', desde, hasta],
    queryFn: () => reportsApi.getRoomReport(desde || hasta ? { desde: desde || undefined, hasta: hasta || undefined } : undefined),
    enabled: false,
  });

  const data = report?.data || [];
  const totales = report?.totales || {};

  const runReport = () => {
    if (!desde && !hasta) {
      alert('Seleccione un rango de fechas');
      return;
    }
    refetch();
  };

  const downloadCsv = () => {
    const header = ['Habitación', 'Tipo', 'Piso', 'Servicios', 'Recargos', 'Pedidos', 'Total'];
    const rows = data.map((r: any) => [
      r.room.numero,
      r.room.roomType?.nombre || '—',
      String(r.room.piso || '—'),
      String(r.servicios),
      String(r.recargos),
      String(r.pedidos),
      String(r.total),
    ]);
    const totalRow = [
      'TOTAL',
      '',
      '',
      String(totales.servicios || 0),
      String(totales.recargos || 0),
      String(totales.pedidos || 0),
      String(totales.total || 0),
    ];
    const csv = [header, ...rows, totalRow]
      .map((row: string[]) => row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-habitaciones-${desde || 'inicio'}-${hasta || 'hoy'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toastSuccess('Reporte descargado');
  };

  const downloadExcel = () => {
    const header = ['Habitación', 'Tipo', 'Piso', 'Servicios', 'Recargos', 'Pedidos', 'Total'];
    const rows: any[][] = data.map((r: any) => [
      r.room.numero,
      r.room.roomType?.nombre || '—',
      r.room.piso || '—',
      r.servicios,
      r.recargos,
      r.pedidos,
      r.total,
    ]);
    const totalRow = [
      'TOTAL',
      '',
      '',
      totales.servicios || 0,
      totales.recargos || 0,
      totales.pedidos || 0,
      totales.total || 0,
    ];
    const esc = (v: any) => String(v ?? '').replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
    const thead = `<tr>${header.map((h) => `<th style="border:1px solid #999;background:#f1f1f1;font-weight:bold;padding:6px">${esc(h)}</th>`).join('')}</tr>`;
    const tbody = [...rows, totalRow].map((r) => `<tr>${r.map((c) => `<td style="border:1px solid #999;padding:6px">${esc(c)}</td>`).join('')}</tr>`).join('');
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table>${thead}${tbody}</table></body></html>`;
    const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-habitaciones-${desde || 'inicio'}-${hasta || 'hoy'}.xls`;
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
        <h1 className="text-2xl font-bold">Reporte por Habitación</h1>
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
              {report.count} habitación(es) · Total: <span className="font-semibold text-foreground">{formatCurrency(totales.total)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={downloadCsv} disabled={data.length === 0}>
                <Download className="mr-1 h-4 w-4" /> Descargar
              </Button>
              <Button variant="outline" size="sm" onClick={downloadExcel} disabled={data.length === 0}>
                <FileSpreadsheet className="mr-1 h-4 w-4" /> Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} disabled={data.length === 0}>
                <Printer className="mr-1 h-4 w-4" /> Imprimir
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Totales Generales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="rounded-lg bg-green-50 p-4 border border-green-200 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Utensils className="h-4 w-4 text-green-700" />
                    <p className="text-xs text-green-700 font-medium uppercase tracking-wider">Servicios</p>
                  </div>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(totales.servicios)}</p>
                  <p className="text-xs text-muted-foreground">{totales.serviciosCount} consumos</p>
                </div>
                <div className="rounded-lg bg-orange-50 p-4 border border-orange-200 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Tag className="h-4 w-4 text-orange-700" />
                    <p className="text-xs text-orange-700 font-medium uppercase tracking-wider">Recargos</p>
                  </div>
                  <p className="text-2xl font-bold text-orange-700">{formatCurrency(totales.recargos)}</p>
                  <p className="text-xs text-muted-foreground">{totales.recargosCount} recargos</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-4 border border-blue-200 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <ShoppingCart className="h-4 w-4 text-blue-700" />
                    <p className="text-xs text-blue-700 font-medium uppercase tracking-wider">Pedidos</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{formatCurrency(totales.pedidos)}</p>
                  <p className="text-xs text-muted-foreground">{totales.pedidosCount} pedidos</p>
                </div>
                <div className="rounded-lg bg-gray-100 p-4 border border-gray-200 text-center">
                  <p className="text-xs text-gray-700 font-medium uppercase tracking-wider">Total General</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totales.total)}</p>
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
                      <th className="px-4 py-3 text-left font-medium">Habitación</th>
                      <th className="px-4 py-3 text-left font-medium">Tipo</th>
                      <th className="px-4 py-3 text-center font-medium">Piso</th>
                      <th className="px-4 py-3 text-right font-medium">
                        <div className="flex items-center justify-end gap-1">
                          <Utensils className="h-4 w-4 text-green-700" /> Servicios
                        </div>
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        <div className="flex items-center justify-end gap-1">
                          <Tag className="h-4 w-4 text-orange-700" /> Recargos
                        </div>
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        <div className="flex items-center justify-end gap-1">
                          <ShoppingCart className="h-4 w-4 text-blue-700" /> Pedidos
                        </div>
                      </th>
                      <th className="px-4 py-3 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                          Sin datos en el rango seleccionado
                        </td>
                      </tr>
                    ) : (
                      data.map((r: any) => (
                        <tr key={r.room.id} className="border-b hover:bg-muted/50">
                          <td className="px-4 py-3 font-medium">
                            <div className="flex items-center gap-2">
                              <BedDouble className="h-4 w-4 text-muted-foreground" />
                              {r.room.numero}
                            </div>
                          </td>
                          <td className="px-4 py-3">{r.room.roomType?.nombre || '—'}</td>
                          <td className="px-4 py-3 text-center">{r.room.piso || '—'}</td>
                          <td className="px-4 py-3 text-right font-medium text-green-700">
                            {r.serviciosCount > 0 && (
                              <Badge variant="secondary" className="mr-1 text-xs">{r.serviciosCount}</Badge>
                            )}
                            {formatCurrency(r.servicios)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-orange-700">
                            {r.recargosCount > 0 && (
                              <Badge variant="secondary" className="mr-1 text-xs">{r.recargosCount}</Badge>
                            )}
                            {formatCurrency(r.recargos)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-blue-700">
                            {r.pedidosCount > 0 && (
                              <Badge variant="secondary" className="mr-1 text-xs">{r.pedidosCount}</Badge>
                            )}
                            {formatCurrency(r.pedidos)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-lg">{formatCurrency(r.total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">TOTAL</th>
                      <th className="px-4 py-3"></th>
                      <th className="px-4 py-3"></th>
                      <th className="px-4 py-3 text-right font-medium text-green-700">
                        <Badge variant="secondary" className="mr-1 text-xs">{totales.serviciosCount}</Badge>
                        {formatCurrency(totales.servicios)}
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-orange-700">
                        <Badge variant="secondary" className="mr-1 text-xs">{totales.recargosCount}</Badge>
                        {formatCurrency(totales.recargos)}
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-blue-700">
                        <Badge variant="secondary" className="mr-1 text-xs">{totales.pedidosCount}</Badge>
                        {formatCurrency(totales.pedidos)}
                      </th>
                      <th className="px-4 py-3 text-right font-bold text-lg">{formatCurrency(totales.total)}</th>
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