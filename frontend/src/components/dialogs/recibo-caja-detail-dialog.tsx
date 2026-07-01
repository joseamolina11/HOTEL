import { useQuery } from '@tanstack/react-query';
import { reciboCajaApi } from '@/api/recibo-caja.api';
import { hotelConfigApi } from '@/api/hotel-config.api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Printer, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ReservationDetailDialog } from './reservation-detail-dialog';
import { useState } from 'react';

export function ReciboCajaDetailDialog({ reciboId, open, onClose }: { reciboId: string | null; open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['recibo-caja-detail', reciboId],
    queryFn: () => reciboCajaApi.findOne(reciboId!),
    enabled: !!reciboId,
  });

  const { data: hotelConfig } = useQuery({
    queryKey: ['hotel-config'],
    queryFn: () => hotelConfigApi.getConfig(),
  });

  const recibo = data?.recibo;
  const items = recibo?.items || [];
  const pagos = recibo?.pagos || [];
  const reservation = recibo?.reservation;
  const consumptions = reservation?.consumptions || [];
  const noches = reservation
    ? Math.ceil(
        (new Date(reservation.fechaSalida).getTime() - new Date(reservation.fechaEntrada).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !recibo) return;
    const hc = hotelConfig;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Recibo ${recibo.codigo}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; margin: 40px; color: #000; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { font-size: 20px; margin-bottom: 2px; }
          .header .hotel-name { font-size: 16px; font-weight: bold; }
          .header .hotel-info { font-size: 11px; color: #555; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          th, td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #ddd; }
          th { font-weight: bold; background: #f5f5f5; font-size: 11px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .total-row td { font-weight: bold; border-top: 2px solid #000; }
          .section-title { font-weight: bold; margin-top: 16px; margin-bottom: 4px; font-size: 14px; }
          .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #888; }
          hr { border: none; border-top: 1px dashed #ccc; margin: 16px 0; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          ${hc?.logo ? `<img src="${import.meta.env.VITE_API_URL_BACKEND + hc.logo}" style="max-height:60px;margin-bottom:8px;" />` : ''}
          <div class="hotel-name">${hc?.nombre || 'HOTEL'}</div>
          <div class="hotel-info">${hc?.direccion || ''}${hc?.ciudad ? ', ' + hc.ciudad : ''}${hc?.pais ? ', ' + hc.pais : ''}</div>
          <div class="hotel-info">Tel: ${hc?.telefono || ''} | Email: ${hc?.email || ''}</div>
          <hr>
          <h1 style="font-size:18px;margin:8px 0;">RECIBO DE CAJA</h1>
          <h2 style="font-size:14px;margin:4px 0;color:#555;">${recibo.codigo}</h2>
        </div>

        <table style="margin-bottom:16px;">
          <tr><td style="width:50%;border:none;padding:2px 8px;"><strong>Cliente:</strong> ${recibo.clienteNombre || '—'}</td>
              <td style="width:50%;border:none;padding:2px 8px;"><strong>Fecha:</strong> ${recibo.fecha}</td></tr>
          ${reservation ? `
          <tr><td style="border:none;padding:2px 8px;"><strong>Reserva:</strong> ${reservation.codigo || '—'}</td>
              <td style="border:none;padding:2px 8px;"><strong>Huésped:</strong> ${reservation.guest?.nombres || ''} ${reservation.guest?.apellidos || ''}</td></tr>
          <tr><td style="border:none;padding:2px 8px;"><strong>Habitación:</strong> ${reservation.room?.nombre || '—'} (${reservation.room?.roomType?.nombre || '—'})</td>
              <td style="border:none;padding:2px 8px;"><strong>Noches:</strong> ${noches}</td></tr>
          <tr><td style="border:none;padding:2px 8px;"><strong>Entrada:</strong> ${new Date(reservation.fechaEntrada).toLocaleDateString()}</td>
              <td style="border:none;padding:2px 8px;"><strong>Salida:</strong> ${new Date(reservation.fechaSalida).toLocaleDateString()}</td></tr>
          ` : ''}
          ${recibo.observaciones ? `<tr><td style="border:none;padding:2px 8px;" colspan="2"><strong>Obs.:</strong> ${recibo.observaciones}</td></tr>` : ''}
        </table>

        ${items.length > 0 ? `
        <div class="section-title">Detalle</div>
        <table>
          <thead>
            <tr>
              <th>Concepto</th>
              <th class="text-center">Cant.</th>
              <th class="text-right">P. Unit.</th>
              <th class="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((i: any) => `
              <tr>
                <td>${i.concepto}</td>
                <td class="text-center">${i.cantidad}</td>
                <td class="text-right">$${Number(i.precioUnitario).toFixed(2)}</td>
                <td class="text-right">$${Number(i.subtotal).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        <div class="section-title">Pagos</div>
        <table>
          <thead>
            <tr>
              <th>Concepto</th>
              <th class="text-right">Monto</th>
              <th class="text-center">Método de Pago</th>
            </tr>
          </thead>
          <tbody>
            ${pagos.map((p: any) => `
              <tr>
                <td>${p.concepto}</td>
                <td class="text-right">$${Number(p.monto).toFixed(2)}</td>
                <td class="text-center">${p.metodoPago?.tipo || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <table>
          <tr>
            <td style="text-align:right;width:70%"><strong>Subtotal:</strong></td>
            <td class="text-right" style="width:30%">$${Number(recibo.subtotal).toFixed(2)}</td>
          </tr>
          ${Number(recibo.descuento) > 0 ? `
          <tr>
            <td style="text-align:right"><strong>Descuento:</strong></td>
            <td class="text-right">-$${Number(recibo.descuento).toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr class="total-row">
            <td style="text-align:right"><strong>TOTAL:</strong></td>
            <td class="text-right">$${Number(recibo.total).toFixed(2)}</td>
          </tr>
        </table>

        <hr>
        <div class="footer">
          <p>${hc?.nombre || ''} &mdash; ${hc?.direccion || ''} | Tel: ${hc?.telefono || ''}</p>
          <p>${recibo.codigo} &mdash; ${recibo.fecha}</p>
          <p>¡Gracias por su preferencia!</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };
  const [isOpenReservation, setisOpenReservation] = useState(false);
  const handleOpenReservation = () => {
    setisOpenReservation(true);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Recibo de Caja {recibo?.codigo || ''}</DialogTitle>
          <Button variant="outline" size="sm" onClick={handlePrint} disabled={!recibo}>
            <Printer className="h-4 w-4 mr-2" /> Imprimir
          </Button>
        </DialogHeader>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Cargando...</div>
        ) : recibo ? (
          <div className="space-y-6">
            <div className="rounded-lg border p-4 text-sm text-center">
              {hotelConfig?.logo && (
                <img src={import.meta.env.VITE_API_URL_BACKEND + hotelConfig.logo} alt="Logo" className="h-12 mx-auto mb-2" />
              )}
              <div className="font-bold text-lg">{hotelConfig?.nombre || 'HOTEL'}</div>
              <div className="text-muted-foreground text-xs">
                {hotelConfig?.direccion || ''}{hotelConfig?.ciudad ? `, ${hotelConfig.ciudad}` : ''}{hotelConfig?.pais ? `, ${hotelConfig.pais}` : ''}
              </div>
              <div className="text-muted-foreground text-xs">
                Tel: {hotelConfig?.telefono || ''} | Email: {hotelConfig?.email || ''}
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4 text-sm grid grid-cols-2 gap-y-2 gap-x-6">
              <div><span className="text-muted-foreground">Cliente: </span>{recibo.clienteNombre || '—'}</div>
              <div><span className="text-muted-foreground">Fecha: </span>{recibo.fecha}</div>
              <div><span className="text-muted-foreground">Código: </span><span className="font-mono font-medium">{recibo.codigo}</span></div>
              <div><span className="text-muted-foreground">Observaciones: </span>{recibo.observaciones || '—'}</div>
            </div>

            {reservation && (
              <div>
                <h3 className="text-sm font-medium mb-2">Reserva</h3>
                  <div className="rounded-lg bg-muted p-4 text-sm grid grid-cols-2 gap-y-2 gap-x-6">
                    <div><span className="text-muted-foreground">Código: </span>
                      <button className="text-primary hover:underline cursor-pointer inline-flex items-center gap-1" onClick={handleOpenReservation}>
                        {reservation.codigo || '—'} <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                    <div><span className="text-muted-foreground">Huésped: </span>{reservation.guest?.nombres || ''} {reservation.guest?.apellidos || ''}</div>
                  <div><span className="text-muted-foreground">Habitación: </span>{reservation.room?.nombre || '—'} ({reservation.room?.roomType?.nombre || '—'})</div>
                  <div><span className="text-muted-foreground">Noches: </span>{noches}</div>
                  <div><span className="text-muted-foreground">Entrada: </span>{new Date(reservation.fechaEntrada).toLocaleDateString()}</div>
                  <div><span className="text-muted-foreground">Salida: </span>{new Date(reservation.fechaSalida).toLocaleDateString()}</div>
                </div>
              </div>
            )}

            {items.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Detalle</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-3 py-2 text-left font-medium">Concepto</th>
                        <th className="px-3 py-2 text-center font-medium">Cant.</th>
                        <th className="px-3 py-2 text-right font-medium">P. Unit.</th>
                        <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((i: any) => (
                        <tr key={i.id} className="border-b">
                          <td className="px-3 py-2">{i.concepto}</td>
                          <td className="px-3 py-2 text-center">{i.cantidad}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(i.precioUnitario)}</td>
                          <td className="px-3 py-2 text-right font-medium">{formatCurrency(i.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium mb-2">Pagos</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-3 py-2 text-left font-medium">Concepto</th>
                      <th className="px-3 py-2 text-right font-medium">Monto</th>
                      <th className="px-3 py-2 text-center font-medium">Método de Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.map((p: any) => (
                      <tr key={p.id} className="border-b">
                        <td className="px-3 py-2">{p.concepto}</td>
                        <td className="px-3 py-2 text-right font-medium">{formatCurrency(p.monto)}</td>
                        <td className="px-3 py-2 text-center">{p.metodoPago?.tipo || '—'}</td>
                      </tr>
                    ))}
                    {pagos.length === 0 && (
                      <tr><td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">Sin pagos registrados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-end">
                <div className="w-72 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(recibo.subtotal)}</span>
                  </div>
                  {Number(recibo.descuento) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Descuento</span>
                      <span className="text-red-600">-{formatCurrency(recibo.descuento)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold border-t pt-1">
                    <span>Total</span>
                    <span>{formatCurrency(recibo.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-destructive">No se pudo cargar el recibo</div>
        )}
        <ReservationDetailDialog reservation={recibo?.reservation || null} open={isOpenReservation} onClose={() => setisOpenReservation(false)} />
      </DialogContent>
    </Dialog>
  );
}
