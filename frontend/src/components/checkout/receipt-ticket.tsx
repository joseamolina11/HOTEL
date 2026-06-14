import { formatDateShort, formatCurrency } from '@/lib/utils';

interface ReceiptTicketProps {
  hotelConfig: {
    nombre?: string;
    direccion?: string;
    ciudad?: string;
    pais?: string;
    telefono?: string;
    email?: string;
    logo?: string;
  } | null;
  reservation: {
    codigo: string;
    guest?: { nombres: string; apellidos: string };
    room?: { nombre: string; roomType?: { nombre: string } };
    fechaEntrada: string;
    fechaSalida: string;
  };
  summary: {
    noches: number;
    precioPorNoche: number;
    totalHabitacion: number;
    consumos: any[];
    totalConsumos: number;
    pedidos: any[];
    totalPedidos: number;
    payments: any[];
    totalPagado: number;
    totalEstancia: number;
    saldoPendiente: number;
  };
}

export function printReceipt(data: ReceiptTicketProps) {
  const h = data.hotelConfig;
  const r = data.reservation;
  const s = data.summary;

  const w = window.open(
    '',
    '_blank',
    'width=800,height=600,left=100,top=100'
  );
  if (!w) return;

  const logoHtml = h?.logo
    ? `<img src="${import.meta.env.VITE_API_URL_BACKEND + h.logo}" style="max-height:60px;margin-bottom:8px" />`
    : '';

  const now = new Date();
  const dateStr = now.toLocaleDateString('es-MX', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

  const consumosHtml = s.consumos?.length
    ? `<tr><td colspan="2" style="font-weight:bold;padding-top:8px;border-top:1px dashed #999">CONSUMOS</td></tr>
       ${s.consumos.map((c: any) =>
         `<tr>
            <td style="padding:2px 4px">${c.inventoryItem?.nombre || 'Producto'} x${c.cantidad}</td>
            <td style="padding:2px 4px;text-align:right">${formatCurrency(c.subtotal)}</td>
          </tr>`
       ).join('')}`
    : '';

  const pedidosHtml = s.pedidos?.length
    ? `<tr><td colspan="2" style="font-weight:bold;padding-top:8px;border-top:1px dashed #999">PEDIDOS</td></tr>
       ${s.pedidos.map((o: any) =>
         `<tr>
            <td style="padding:2px 4px">${o.codigo}</td>
            <td style="padding:2px 4px;text-align:right">${formatCurrency(o.total)}</td>
          </tr>
          ${(o.items || []).map((i: any) =>
            `<tr>
               <td style="padding:1px 4px;padding-left:12px;font-size:10px">${i.inventoryItem?.nombre} x${i.cantidad}</td>
               <td style="padding:1px 4px;text-align:right;font-size:10px">${formatCurrency(i.subtotal)}</td>
             </tr>`
          ).join('')}`
       ).join('')}`
    : '';

  const paymentsHtml = s.payments?.length
    ? `<tr><td colspan="2" style="font-weight:bold;padding-top:8px;border-top:1px dashed #999">PAGOS</td></tr>
       ${s.payments.map((p: any) =>
         `<tr>
            <td style="padding:2px 4px;text-transform:capitalize">${p.metodoPago}${p.comprobante ? ` (${p.comprobante})` : ''}</td>
            <td style="padding:2px 4px;text-align:right">${formatCurrency(p.monto)}</td>
          </tr>`
       ).join('')}`
    : '';

  w.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Recibo - ${h?.nombre || 'Hotel'}</title>
  <style>
    @page { margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      width: 80mm;
      padding: 10px 8px;
      color: #222;
      line-height: 1.4;
    }
    .header { text-align: center; margin-bottom: 12px; }
    .header h2 { font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
    .header .info { font-size: 10px; color: #555; }
    .divider { border-top: 1px dashed #999; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 2px 4px; vertical-align: top; }
    .total-row td { font-weight: bold; padding-top: 4px; }
    .grand-total { font-size: 14px; font-weight: bold; }
    .paid { color: #16a34a; }
    .pending { color: #dc2626; }
    .footer { text-align: center; margin-top: 12px; font-size: 10px; color: #888; }
    .label { color: #666; }
  </style>
</head>
<body>
  <div class="header">
    ${logoHtml}
    <h2>${h?.nombre || 'Hotel'}</h2>
    <div class="info">${h?.direccion || ''}${h?.ciudad ? `, ${h.ciudad}` : ''}${h?.pais ? `, ${h.pais}` : ''}</div>
    <div class="info">${h?.telefono ? `Tel: ${h.telefono}` : ''}${h?.email ? ` | ${h.email}` : ''}</div>
    <div class="info">${dateStr}</div>
  </div>

  <div class="divider"></div>

  <table>
    <tr><td class="label">Habitacion</td><td style="text-align:right">${r.room?.nombre || ''}${r.room?.roomType?.nombre ? ` (${r.room.roomType.nombre})` : ''}</td></tr>
    <tr><td class="label">Huesped</td><td style="text-align:right">${r.guest?.nombres || ''} ${r.guest?.apellidos || ''}</td></tr>
    <tr><td class="label">Reserva</td><td style="text-align:right">${r.codigo}</td></tr>
    <tr><td class="label">Periodo</td><td style="text-align:right">${formatDateShort(r.fechaEntrada)} - ${formatDateShort(r.fechaSalida)}</td></tr>
  </table>

  <div class="divider"></div>

  <table>
    <tr><td>Alojamiento (${s.noches} noche${s.noches !== 1 ? 's' : ''} x ${formatCurrency(s.precioPorNoche)})</td><td style="text-align:right">${formatCurrency(s.totalHabitacion)}</td></tr>
    ${consumosHtml}
    ${pedidosHtml}
    <tr class="total-row"><td style="padding-top:8px;border-top:2px solid #222">TOTAL ESTANCIA</td><td style="text-align:right;padding-top:8px;border-top:2px solid #222" class="grand-total">${formatCurrency(s.totalEstancia)}</td></tr>
  </table>

  ${s.payments?.length ? `<div class="divider"></div><table>${paymentsHtml}<tr class="total-row"><td>TOTAL PAGADO</td><td style="text-align:right" class="paid">${formatCurrency(s.totalPagado)}</td></tr></table>` : ''}

  <div class="divider"></div>

  <table>
    <tr><td style="font-size:14px;font-weight:bold">SALDO</td><td style="text-align:right;font-size:14px;font-weight:bold" class="${s.saldoPendiente > 0 ? 'pending' : 'paid'}">${formatCurrency(s.saldoPendiente)}</td></tr>
  </table>

  <div class="footer">
    <p>¡Gracias por su preferencia!</p>
  </div>
</body>
</html>`);

  w.document.close();
  setTimeout(() => {
    w.print();
    w.close();
  }, 500);
}
