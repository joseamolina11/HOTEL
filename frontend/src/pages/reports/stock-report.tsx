import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toastSuccess } from '@/lib/notifications';

interface StockRow {
  id: string;
  nombre: string;
  categoria?: string;
  unidadMedida?: string;
  proveedor?: string;
  stockInicial: number;
  stockActual: number;
  stockMinimo?: number;
  costoUnitario?: number;
}

interface StockReportProps {
  title: string;
  fileName: string;
  columns: string[];
  fetchFn: () => Promise<StockRow[]>;
  withProveedor?: boolean;
  withUnidad?: boolean;
  withCosto?: boolean;
}

export function StockReportSection({ title, fileName, columns, fetchFn, withProveedor, withUnidad, withCosto }: StockReportProps) {
  const [rows, setRows] = useState<StockRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const runPreview = async () => {
    setLoading(true);
    try {
      const data = await fetchFn();
      setRows(data || []);
    } finally {
      setLoading(false);
    }
  };

  const esc = (v: any) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const cellValues = (r: StockRow) => [
    r.nombre,
    r.categoria || '—',
    withProveedor ? r.proveedor || '—' : null,
    withUnidad ? r.unidadMedida || '—' : null,
    r.stockInicial,
    r.stockActual,
    withCosto ? Number(r.costoUnitario) || 0 : null,
  ].filter((c) => c !== null);

  const downloadExcel = () => {
    if (!rows || rows.length === 0) return;
    const thead = `<tr>${columns.map((h) => `<th style="border:1px solid #999;background:#f1f1f1;font-weight:bold;padding:6px">${esc(h)}</th>`).join('')}</tr>`;
    const tbody = rows.map((r) => `<tr>${cellValues(r).map((c) => `<td style="border:1px solid #999;padding:6px">${esc(c)}</td>`).join('')}</tr>`).join('');
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table>${thead}${tbody}</table></body></html>`;
    const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toastSuccess('Excel descargado');
  };

  const totalInicial = rows?.reduce((sum, r) => sum + Number(r.stockInicial), 0) || 0;
  const totalActual = rows?.reduce((sum, r) => sum + Number(r.stockActual), 0) || 0;

  return (
    <div className="space-y-4">
      <Card className="print:hidden">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Stock inicial = primer movimiento registrado del producto · Stock actual = existencias actuales.
            </p>
            <div className="flex items-center gap-2">
              <Button onClick={runPreview} disabled={loading} className="min-w-28">
                {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                Previsualizar
              </Button>
              <Button variant="outline" onClick={downloadExcel} disabled={!rows || rows.length === 0}>
                <FileSpreadsheet className="mr-1 h-4 w-4" /> Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {rows && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {columns.map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                        Sin registros
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.id} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">{r.nombre}</td>
                        <td className="px-4 py-3">{r.categoria || '—'}</td>
                        {withProveedor && <td className="px-4 py-3">{r.proveedor || '—'}</td>}
                        {withUnidad && <td className="px-4 py-3">{r.unidadMedida || '—'}</td>}
                        <td className="px-4 py-3 text-right">{Number(r.stockInicial)}</td>
                        <td className="px-4 py-3 text-right font-medium">{Number(r.stockActual)}</td>
                        {withCosto && <td className="px-4 py-3 text-right">{formatCurrency(Number(r.costoUnitario))}</td>}
                      </tr>
                    ))
                  )}
                </tbody>
                {rows.length > 0 && (
                  <tfoot>
                    <tr className="border-t bg-muted/40 font-medium">
                      <td colSpan={withProveedor && withUnidad ? 4 : withProveedor || withUnidad ? 3 : 2} className="px-4 py-3 text-right">Total</td>
                      <td className="px-4 py-3 text-right">{totalInicial}</td>
                      <td className="px-4 py-3 text-right">{totalActual}</td>
                      {withCosto && <td className="px-4 py-3" />}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {rows && (
        <div className="hidden print:block text-xs mt-4">
          <h3 className="text-sm font-bold mb-1">{title}</h3>
          <p>Generado el {new Date().toLocaleDateString()} · Stock inicial = primer movimiento · Stock actual = existencias.</p>
        </div>
      )}
    </div>
  );
}
