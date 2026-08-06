import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '@/api/reports.api';
import { tercerosApi } from '@/api/terceros.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Printer, CheckCircle2, Undo2, Loader2, FileSpreadsheet } from 'lucide-react';
import { formatDateShort, formatCurrency } from '@/lib/utils';
import { toastSuccess, confirmAction } from '@/lib/notifications';

function CheckboxCell({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      aria-label={label}
      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
    />
  );
}

export function ReportsPage() {
  const qc = useQueryClient();
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [terceroId, setTerceroId] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: terceros } = useQuery({
    queryKey: ['terceros', 'active'],
    queryFn: () => tercerosApi.findAllActive(),
  });

  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['reports', 'surcharges', desde, hasta, terceroId],
    queryFn: () => reportsApi.getSurchargesReport(desde || hasta || terceroId ? { desde: desde || undefined, hasta: hasta || undefined, terceroId: terceroId || undefined } : undefined),
    enabled: false,
  });

  const surcharges = report?.data || [];
  const selectedItems = surcharges?.filter((s: any) => selected.has(s.id));

  const disperseMut = useMutation({
    mutationFn: ({ ids, disperse }: { ids: string[]; disperse?: boolean }) => reportsApi.disperseSurcharges(ids, disperse),
    onSuccess: (res) => {
      toastSuccess(`${res?.updated ?? 0} recargo(s) actualizado(s)`);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ['reports'] });
      qc.invalidateQueries({ queryKey: ['surcharges'] });
    },
  });

  const runReport = () => {
    if (!desde && !hasta && !terceroId) {
      alert('Seleccione un rango de fechas o una cuenta a tercero');
      return;
    }
    setSelected(new Set());
    refetch();
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(surcharges.map((s: any) => s.id)));
    } else {
      setSelected(new Set());
    }
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const allSelected = surcharges.length > 0 && selected.size === surcharges.length;

  const downloadCsv = () => {
    const header = ['Consecutivo', 'Referencia', 'Fecha', 'Reserva', 'Huésped', 'Habitación', 'Tipo', 'Descripción', 'Tercero', 'Cantidad', 'Monto', 'Subtotal', 'Dispersado'];
    const rows = surcharges.map((s: any) => [
      s.consecutivo || '',
      s.referencia || '',
      formatDateShort(s.fecha),
      s.reservation?.codigo || '',
      s.reservation?.guest ? `${s.reservation.guest.nombres} ${s.reservation.guest.apellidos}` : '',
      s.reservation?.room?.nombre || '',
      s.surchargeType?.nombre || '',
      s.descripcion || '',
      s.tercero?.nombre || s.surchargeType?.tercero?.nombre || '',
      String(s.cantidad ?? 1),
      String(Number(s.monto) || 0),
      String(Number(s.subtotal) || 0),
      s.dispersado ? 'Sí' : 'No',
    ]);
    const csv = [header, ...rows]
      .map((row: string[]) => row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-recargos-${desde || 'inicio'}-${hasta || 'hoy'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toastSuccess('Reporte descargado');
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadExcel = () => {
    const header = ['Consecutivo', 'Referencia', 'Fecha', 'Reserva', 'Huésped', 'Habitación', 'Tipo', 'Descripción', 'Tercero', 'Cantidad', 'Monto', 'Subtotal', 'Dispersado'];
    const rows: any[][] = surcharges.map((s: any) => [
      s.consecutivo || '',
      s.referencia || '',
      formatDateShort(s.fecha),
      s.reservation?.codigo || '',
      s.reservation?.guest ? `${s.reservation.guest.nombres} ${s.reservation.guest.apellidos}` : '',
      s.reservation?.room?.nombre || '',
      s.surchargeType?.nombre || '',
      s.descripcion || '',
      s.tercero?.nombre || s.surchargeType?.tercero?.nombre || '',
      s.cantidad ?? 1,
      Number(s.monto) || 0,
      Number(s.subtotal) || 0,
      s.dispersado ? 'Sí' : 'No',
    ]);
    const esc = (v: any) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const thead = `<tr>${header.map((h) => `<th style="border:1px solid #999;background:#f1f1f1;font-weight:bold;padding:6px">${esc(h)}</th>`).join('')}</tr>`;
    const tbody = rows.map((r) => `<tr>${r.map((c) => `<td style="border:1px solid #999;padding:6px">${esc(c)}</td>`).join('')}</tr>`).join('');
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table>${thead}${tbody}</table></body></html>`;
    const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-recargos-${desde || 'inicio'}-${hasta || 'hoy'}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toastSuccess('Excel descargado');
  };

  const handleDisperse = async () => {
    if (selected.size === 0) return;
    const r = await confirmAction('Marcar como dispersados', `¿Dispersar ${selected.size} recargo(s) seleccionado(s)?`);
    if (r.isConfirmed) disperseMut.mutate({ ids: [...selected] });
  };

  const unDispersedSelected = selectedItems.filter((s: any) => !s.dispersado);
  const dispersedSelected = selectedItems.filter((s: any) => s.dispersado);
  const canDisperse = unDispersedSelected.length > 0;

  const totals = useMemo(() => {
    return {
      total: surcharges.reduce((sum: number, s: any) => sum + Number(s.subtotal), 0),
      porDispersar: surcharges.filter((s: any) => !s.dispersado).reduce((sum: number, s: any) => sum + Number(s.subtotal), 0),
    };
  }, [surcharges]);

  return (
    <div className="space-y-6 print-area">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold">Reporte de Recargos</h1>
      </div>

      <Card className="print:hidden">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Cuenta a tercero</label>
              <select
                className="flex h-9 min-w-56 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={terceroId}
                onChange={(e) => setTerceroId(e.target.value)}
              >
                <option value="">Todos los terceros</option>
                {(terceros || []).map((t: any) => (
                  <option key={t.id} value={t.id}>{t.nombre}{t.tipo === 'empresa' ? ' (Empresa)' : ''}</option>
                ))}
              </select>
            </div>
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
              {report.count} recargo(s) · Total: <span className="font-semibold text-foreground">{formatCurrency(totals.total)}</span>
              <span className="mx-1">·</span>
              Por dispersar: <span className="font-semibold text-amber-600">{formatCurrency(totals.porDispersar)}</span>
              <span className="mx-1">·</span>
              Seleccionados: <span className="font-semibold text-foreground">{selected.size}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={downloadCsv} disabled={surcharges.length === 0}>
                <Download className="mr-1 h-4 w-4" /> Descargar
              </Button>
              <Button variant="outline" size="sm" onClick={downloadExcel} disabled={surcharges.length === 0}>
                <FileSpreadsheet className="mr-1 h-4 w-4" /> Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} disabled={surcharges.length === 0}>
                <Printer className="mr-1 h-4 w-4" /> Imprimir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisperse}
                disabled={!canDisperse || disperseMut.isPending}
                title="Marcar seleccionados como dispersados"
              >
                <CheckCircle2 className="mr-1 h-4 w-4" /> Marcar dispersado
              </Button>
              {dispersedSelected.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => disperseMut.mutate({ ids: dispersedSelected.map((s: any) => s.id), disperse: false })}
                  disabled={disperseMut.isPending}
                  title="Desmarcar seleccionados"
                >
                  <Undo2 className="mr-1 h-4 w-4" /> Desmarcar
                </Button>
              )}
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="w-10 px-4 py-3">
                        <CheckboxCell checked={allSelected} onChange={toggleAll} label="Seleccionar todos" />
                      </th>
                      <th className="px-4 py-3 text-left font-medium">Consecutivo</th>
                      <th className="px-4 py-3 text-left font-medium">Fecha</th>
                      <th className="px-4 py-3 text-left font-medium">Reserva</th>
                      <th className="px-4 py-3 text-left font-medium">Huésped</th>
                      <th className="px-4 py-3 text-left font-medium">Habitación</th>
                      <th className="px-4 py-3 text-left font-medium">Tipo</th>
                      <th className="px-4 py-3 text-left font-medium">Descripción</th>
                      <th className="px-4 py-3 text-left font-medium">Tercero</th>
                      <th className="px-4 py-3 text-right font-medium">Subtotal</th>
                      <th className="px-4 py-3 text-center font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {surcharges.length === 0 ? (
                      <tr><td colSpan={11} className="px-4 py-10 text-center text-muted-foreground">Sin recargos en el rango seleccionado</td></tr>
                    ) : (
                      surcharges.map((s: any) => (
                        <tr key={s.id} className="border-b hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <CheckboxCell checked={selected.has(s.id)} onChange={(v) => toggleOne(s.id, v)} label="Seleccionar" />
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-violet-700">{s.consecutivo || '—'}</span>
                            {s.referencia && <span className="ml-1 text-xs text-muted-foreground">({s.referencia})</span>}
                          </td>
                          <td className="px-4 py-3">{formatDateShort(s.fecha)}</td>
                          <td className="px-4 py-3">{s.reservation?.codigo || '—'}</td>
                          <td className="px-4 py-3">
                            {s.reservation?.guest ? `${s.reservation.guest.nombres} ${s.reservation.guest.apellidos}` : '—'}
                          </td>
                          <td className="px-4 py-3">{s.reservation?.room?.nombre || '—'}</td>
                          <td className="px-4 py-3">{s.surchargeType?.nombre || '—'}</td>
                          <td className="px-4 py-3 text-muted-foreground">{s.descripcion || '—'}</td>
                          <td className="px-4 py-3">{s.tercero?.nombre || s.surchargeType?.tercero?.nombre || '—'}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(s.subtotal))}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={s.dispersado ? 'success' : 'warning'}>
                              {s.dispersado ? 'Dispersado' : 'Por dispersar'}
                            </Badge>
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
            {terceroId && <p>Cuenta a tercero: {(terceros || []).find((t: any) => t.id === terceroId)?.nombre || terceroId}</p>}
          </div>
        </>
      )}
    </div>
  );
}
