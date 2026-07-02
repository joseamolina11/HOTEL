import { formatCurrency, formatDateTime } from '@/lib/utils';

const API_URL = (import.meta as any).env?.VITE_API_URL_BACKEND || '';

const STYLES = `
@page { margin: 10mm 8mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  font-size: 9px;
  color: #333;
  line-height: 1.3;
  background: #fff;
}

/* === HEADER === */
.header-bar {
  background: #1a365d;
  color: #fff;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-bar .logo img { max-height: 45px; }
.header-bar .hotel-info h1 { font-size: 15px; font-weight: 700; }
.header-bar .hotel-info p { font-size: 8px; opacity: .8; }
.header-bar .hotel-info .sep { display: inline-block; margin: 0 4px; opacity: .4; }

/* === TITLE === */
.doc-title { text-align: center; padding: 8px 0 6px; border-bottom: 2px solid #1a365d; margin-bottom: 8px; }
.doc-title h2 { font-size: 13px; font-weight: 700; color: #1a365d; text-transform: uppercase; letter-spacing: 1px; }
.doc-title .doc-ref { font-size: 8px; color: #888; margin-top: 1px; }

/* === INFO ROW === */
.info-row {
  display: flex; justify-content: space-between;
  background: #f5f5f5; padding: 6px 10px; margin-bottom: 6px;
}
.info-row .label { font-size: 7px; color: #888; text-transform: uppercase; }
.info-row .value { font-size: 10px; font-weight: 600; color: #1a365d; }

/* === FIELDS === */
.field-row {
  display: flex; flex-wrap: wrap; gap: 4px 14px;
  padding: 5px 10px; background: #f5f5f5; margin-bottom: 6px;
}
.field-row .field { min-width: 120px; }
.field-row .field-label { font-size: 7px; color: #888; text-transform: uppercase; }
.field-row .field-value { font-size: 9px; font-weight: 600; }

/* === TABLES === */
table.doc-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
table.doc-table thead th {
  background: #1a365d; color: #fff;
  padding: 5px 6px; font-size: 8px; font-weight: 600;
  text-transform: uppercase; text-align: left;
}
table.doc-table tbody td {
  padding: 4px 6px; border-bottom: 1px solid #eee;
  vertical-align: top;
}
table.doc-table tbody tr:nth-child(even) { background: #fafafa; }
table.doc-table tbody tr:last-child td { border-bottom: none; }
table.doc-table .text-right { text-align: right; }
table.doc-table .text-center { text-align: center; }

/* === TOTALS === */
.totals-box { margin: 0 0 6px auto; width: 260px; border: 1px solid #ddd; }
.totals-box table { width: 100%; border-collapse: collapse; }
.totals-box td { padding: 4px 8px; font-size: 9px; border-bottom: 1px solid #eee; }
.totals-box tr:last-child td { border-bottom: none; }
.totals-box .total-label { color: #888; }
.totals-box .total-value { text-align: right; font-weight: 600; }
.totals-box .grand-total-row td { background: #1a365d; color: #fff; font-size: 11px; font-weight: 700; padding: 5px 8px; }

/* === AMOUNT === */
.amount-box { border: 1px solid #1a365d; padding: 8px 14px; text-align: center; margin-bottom: 6px; }
.amount-box .amount-label { font-size: 8px; color: #1a365d; text-transform: uppercase; }
.amount-box .amount-value { font-size: 16px; font-weight: 700; color: #1a365d; }

/* === OBSERVATIONS === */
.obs-box { padding: 5px 10px; background: #fffdf0; border-left: 2px solid #d69e2e; margin-bottom: 6px; }
.obs-box .obs-label { font-size: 7px; color: #975a16; text-transform: uppercase; }
.obs-box .obs-text { font-size: 9px; color: #744210; }

/* === SIGNATURES === */
.signatures { display: flex; justify-content: space-between; margin-top: 14px; padding-top: 8px; border-top: 1px solid #ddd; }
.signatures .sig-block { text-align: center; min-width: 140px; }
.signatures .sig-line { width: 120px; height: 1px; background: #ccc; margin: 0 auto 4px; }
.signatures .sig-label { font-size: 7px; color: #888; text-transform: uppercase; }
.signatures .sig-name { font-size: 9px; font-weight: 600; }

/* === SUMMARY CARDS === */
.summary-cards { display: flex; gap: 6px; margin-bottom: 8px; }
.summary-card { flex: 1; padding: 6px 8px; text-align: center; border: 1px solid #ddd; }
.summary-card .card-label { font-size: 7px; text-transform: uppercase; color: #888; }
.summary-card .card-value { font-size: 12px; font-weight: 700; margin-top: 1px; }
.summary-card.positive { border-color: #c6f6d5; background: #f0fff4; }
.summary-card.positive .card-value { color: #22543d; }
.summary-card.negative { border-color: #feb2b2; background: #fff5f5; }
.summary-card.negative .card-value { color: #9b2c2c; }
.summary-card.total { border-color: #90cdf4; background: #ebf8ff; }
.summary-card.total .card-value { color: #1a365d; }
.summary-card.initial { background: #f9f9f9; }
.summary-card.initial .card-value { color: #333; }

/* === SECTION TITLE === */
.section-title { font-size: 9px; font-weight: 700; color: #1a365d; text-transform: uppercase; letter-spacing: .3px; padding-bottom: 2px; border-bottom: 1px solid #ddd; margin-bottom: 6px; }

/* === STATUS === */
.status-badge { display: inline-block; padding: 1px 6px; font-size: 8px; font-weight: 600; text-transform: uppercase; }
.status-badge.approved { background: #c6f6d5; color: #22543d; }
.status-badge.draft { background: #eee; color: #555; }
.status-badge.cancelled { background: #fed7d7; color: #9b2c2c; }
.status-badge.received { background: #bee3f8; color: #2a4365; }

/* === COMPACT TABLE === */
table.compact-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
table.compact-table thead th { background: #333; color: #fff; padding: 3px 5px; font-size: 7px; font-weight: 600; text-transform: uppercase; text-align: left; }
table.compact-table tbody td { padding: 3px 5px; border-bottom: 1px solid #eee; font-size: 8px; }
table.compact-table tbody tr:nth-child(even) { background: #fafafa; }

.footer-note { margin-top: 10px; text-align: center; font-size: 7px; color: #aaa; border-top: 1px solid #eee; padding-top: 5px; }

.diff-positive { color: #22543d; font-weight: 700; }
.diff-negative { color: #9b2c2c; font-weight: 700; }
`;

function getLogoHtml(logo?: string) {
  return logo
    ? `<img src="${API_URL + logo}" style="max-height:70px;border-radius:4px" />`
    : '';
}

function getHeader(config: any) {
  const h = config;
  const addr = [h?.direccion, h?.ciudad, h?.pais].filter(Boolean).join(', ');
  return `
  <div class="header-bar">
    <div class="logo">${getLogoHtml(h?.logo)}</div>
    <div class="hotel-info">
      <h1>${h?.nombre || 'Hotel'}</h1>
      <p>${addr ? `${addr} <span class="sep">|</span> ` : ''}${h?.telefono ? `Tel: ${h.telefono}` : ''}${h?.telefono && h?.email ? ' <span class="sep">|</span> ' : ''}${h?.email || ''}</p>
    </div>
  </div>`;
}

function openPrintWindow(title: string, bodyHtml: string) {
  const w = window.open('', '_blank', 'width=900,height=650,left=100,top=100');
  if (!w) return;
  w.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>${STYLES}</style>
</head>
<body>
  ${bodyHtml}
  <div class="footer-note">Documento generado el ${new Date().toLocaleString('es-MX')} &mdash; ${title}</div>
</body>
</html>`);
  w.document.close();
  setTimeout(() => { w.print(); w.close(); }, 600);
}

export async function printPurchaseOrder(id: string) {
  const [poModule, configModule] = await Promise.all([
    import('@/api/purchase-orders.api'),
    import('@/api/hotel-config.api'),
  ]);
  const [po, config] = await Promise.all([
    poModule.purchaseOrdersApi.findOne(id),
    configModule.hotelConfigApi.getConfig(),
  ]);

  const itemsHtml = (po.items || []).map((item: any) => `
    <tr>
      <td>${item.descripcion || '—'}</td>
      <td class="text-center">${item.cantidad}</td>
      <td class="text-right">${formatCurrency(item.precioUnitario)}</td>
      <td class="text-right">${formatCurrency(item.subtotal)}</td>
    </tr>`).join('');

  const statusClass = po.estado === 'aprobada' ? 'approved' : po.estado === 'anulada' ? 'cancelled' : po.estado === 'recibida' ? 'received' : 'draft';

  openPrintWindow(`OC ${po.codigo}`, `
    ${getHeader(config)}
    <div class="doc-title">
      <h2>Orden de Compra</h2>
      <div class="doc-ref">N° <strong>${po.codigo}</strong> &mdash; <span class="status-badge ${statusClass}">${po.estado}</span></div>
    </div>

    <div class="info-row">
      <div class="info-item"><div class="label">Proveedor</div><div class="value">${po.supplier?.razonSocial || '—'}</div></div>
      <div class="info-item"><div class="label">RIF</div><div class="value">${po.supplier?.rif || '—'}</div></div>
      <div class="info-item"><div class="label">Fecha</div><div class="value">${po.fecha}</div></div>
      <div class="info-item"><div class="label">Teléfono</div><div class="value">${po.supplier?.telefono || '—'}</div></div>
    </div>

    <div class="section-title">Detalle de productos y servicios</div>
    <table class="doc-table">
      <thead>
        <tr><th style="width:50%">Descripción</th><th style="width:12%" class="text-center">Cantidad</th><th style="width:18%" class="text-right">Precio Unit.</th><th style="width:20%" class="text-right">Subtotal</th></tr>
      </thead>
      <tbody>
        ${itemsHtml || '<tr><td colspan="4" class="text-center" style="color:#a0aec0">Sin items registrados</td></tr>'}
      </tbody>
    </table>

    <div class="totals-box">
      <table>
        <tr><td class="total-label">Subtotal</td><td class="total-value">${formatCurrency(po.subtotal)}</td></tr>
        <tr><td class="total-label">Impuesto (${po.tasaImpuesto || 19}%)</td><td class="total-value">${formatCurrency(po.impuestos)}</td></tr>
        <tr class="grand-total-row"><td>TOTAL</td><td>${formatCurrency(po.total)}</td></tr>
      </table>
    </div>

    ${po.observaciones ? `
    <div class="obs-box">
      <div class="obs-label">Observaciones</div>
      <div class="obs-text">${po.observaciones}</div>
    </div>` : ''}

    <div class="signatures">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Creado por</div>
        <div class="sig-name">${po.createdBy?.nombre || po.createdBy?.email || '—'}</div>
      </div>
      ${po.approvedBy ? `
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Aprobado por</div>
        <div class="sig-name">${po.approvedBy.nombre || po.approvedBy.email || '—'}</div>
      </div>` : ''}
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Recibido por</div>
        <div class="sig-name">________________</div>
      </div>
    </div>
  `);
}

export async function printExpense(id: string) {
  const [expModule, configModule] = await Promise.all([
    import('@/api/expenses.api'),
    import('@/api/hotel-config.api'),
  ]);
  const [exp, config] = await Promise.all([
    expModule.expensesApi.findOne(id),
    configModule.hotelConfigApi.getConfig(),
  ]);

  openPrintWindow(`EG ${exp.codigo}`, `
    ${getHeader(config)}
    <div class="doc-title">
      <h2>Comprobante de Egreso</h2>
      <div class="doc-ref">N° <strong>${exp.codigo}</strong></div>
    </div>

    <div class="field-row">
      <div class="field"><div class="field-label">Fecha</div><div class="field-value">${exp.fecha}</div></div>
      <div class="field"><div class="field-label">Categoría</div><div class="field-value">${exp.category?.nombre || '—'}</div></div>
      <div class="field"><div class="field-label">Proveedor</div><div class="field-value">${exp.supplier?.razonSocial || '—'}</div></div>
      <div class="field"><div class="field-label">Método de Pago</div><div class="field-value">${exp.metodoPago?.nombre || '—'}${exp.referencia ? ` (${exp.referencia})` : ''}</div></div>
      ${exp.purchaseOrder ? `<div class="field"><div class="field-label">Orden de Compra</div><div class="field-value">${exp.purchaseOrder.codigo}</div></div>` : ''}
    </div>

    <div class="field-row">
      <div class="field" style="flex:2"><div class="field-label">Concepto</div><div class="field-value">${exp.concepto}</div></div>
    </div>

    <div class="amount-box">
      <div class="amount-label">Monto Total</div>
      <div class="amount-value">${formatCurrency(exp.monto)}</div>
    </div>

    ${exp.observaciones ? `
    <div class="obs-box">
      <div class="obs-label">Observaciones</div>
      <div class="obs-text">${exp.observaciones}</div>
    </div>` : ''}

    <div class="signatures">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Recibido por</div>
        <div class="sig-name">${exp.supplier?.razonSocial || '________________'}</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Registrado por</div>
        <div class="sig-name">${exp.createdBy?.nombre || exp.createdBy?.email || '—'}</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Autorizado por</div>
        <div class="sig-name">________________</div>
      </div>
    </div>
  `);
}

export async function printAccountsPayable(id: string) {
  const [apModule, configModule] = await Promise.all([
    import('@/api/accounts-payable.api'),
    import('@/api/hotel-config.api'),
  ]);
  const [ap, config] = await Promise.all([
    apModule.accountsPayableApi.findOne(id),
    configModule.hotelConfigApi.getConfig(),
  ]);

  const pagos = ap.pagos || [];

  const pagosHtml = pagos.length > 0 ? pagos.map((p: any) => `
    <tr>
      <td>${p.fechaPago}</td>
      <td class="text-right">${formatCurrency(p.monto)}</td>
      <td>${p.metodoPago?.nombre || '—'}</td>
      <td>${p.referencia || '—'}</td>
      <td>${p.user?.nombres || p.user?.nombre || p.user?.email || '—'}</td>
    </tr>`).join('') : '';

  const statusClass = ap.estado === 'pagada' ? 'approved' : ap.estado === 'anulada' ? 'cancelled' : ap.estado === 'vencida' ? 'cancelled' : 'draft';
  const saldoPagado = Number(ap.montoOriginal) - Number(ap.saldoPendiente);

  openPrintWindow(`CP ${ap.codigo}`, `
    ${getHeader(config)}
    <div class="doc-title">
      <h2>Cuenta por Pagar</h2>
      <div class="doc-ref">N° <strong>${ap.codigo}</strong> &mdash; <span class="status-badge ${statusClass}">${ap.estado.replace(/_/g, ' ')}</span></div>
    </div>

    <div class="info-row">
      <div class="info-item"><div class="label">Proveedor</div><div class="value">${ap.supplier?.razonSocial || '—'}</div></div>
      <div class="info-item"><div class="label">RIF</div><div class="value">${ap.supplier?.rif || '—'}</div></div>
      <div class="info-item"><div class="label">Emisión</div><div class="value">${ap.fechaEmision}</div></div>
      <div class="info-item"><div class="label">Vencimiento</div><div class="value">${ap.fechaVencimiento}</div></div>
    </div>

    <div class="field-row">
      <div class="field"><div class="field-label">Orden de Compra</div><div class="field-value">${ap.purchaseOrder?.codigo || '—'}</div></div>
      <div class="field"><div class="field-label">Egreso Origen</div><div class="field-value">${ap.sourceExpense?.codigo || '—'}</div></div>
      <div class="field"><div class="field-label">Registrado por</div><div class="field-value">${ap.createdBy?.nombre || ap.createdBy?.email || '—'}</div></div>
    </div>

    <div class="summary-cards">
      <div class="summary-card initial">
        <div class="card-label">Monto Original</div>
        <div class="card-value">${formatCurrency(ap.montoOriginal)}</div>
      </div>
      <div class="summary-card positive">
        <div class="card-label">Pagado</div>
        <div class="card-value">${formatCurrency(saldoPagado)}</div>
      </div>
      <div class="summary-card total">
        <div class="card-label">Saldo Pendiente</div>
        <div class="card-value">${formatCurrency(ap.saldoPendiente)}</div>
      </div>
    </div>

    ${ap.observaciones ? `
    <div class="obs-box">
      <div class="obs-label">Observaciones</div>
      <div class="obs-text">${ap.observaciones}</div>
    </div>` : ''}

    ${pagosHtml ? `
    <div class="section-title">Historial de Pagos</div>
    <table class="compact-table">
      <thead>
        <tr><th>Fecha</th><th class="text-right">Monto</th><th>Método</th><th>Referencia</th><th>Registrado por</th></tr>
      </thead>
      <tbody>
        ${pagosHtml}
      </tbody>
    </table>` : ''}

    <div class="signatures">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Registrado por</div>
        <div class="sig-name">${ap.createdBy?.nombre || ap.createdBy?.email || '—'}</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Autorizado por</div>
        <div class="sig-name">________________</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Recibido por</div>
        <div class="sig-name">${ap.supplier?.razonSocial || '________________'}</div>
      </div>
    </div>
  `);
}

export async function printFinancialMovements(params?: Record<string, string>) {
  const [movModule, configModule] = await Promise.all([
    import('@/api/financial-movements.api'),
    import('@/api/hotel-config.api'),
  ]);
  const [data, config] = await Promise.all([
    movModule.financialMovementsApi.findAll({ limit: '500', ...params }),
    configModule.hotelConfigApi.getConfig(),
  ]);
  const movements = (data as any)?.data?.data || [];

  const totalIngresos = movements
    .filter((m: any) => ['INGRESO', 'TRANSFERENCIA_ENTRADA', 'APERTURA_CAJA'].includes(m.tipo))
    .reduce((s: number, m: any) => s + Number(m.monto), 0);
  const totalEgresos = movements
    .filter((m: any) => ['EGRESO', 'TRANSFERENCIA_SALIDA'].includes(m.tipo))
    .reduce((s: number, m: any) => s + Number(m.monto), 0);
  const totalAjustes = movements
    .filter((m: any) => m.tipo === 'AJUSTE')
    .reduce((s: number, m: any) => s + Number(m.monto), 0);

  const movRows = movements.map((m: any) => {
    const isIngreso = ['INGRESO', 'TRANSFERENCIA_ENTRADA', 'APERTURA_CAJA'].includes(m.tipo);
    const isAjuste = m.tipo === 'AJUSTE';
    return `
    <tr>
      <td style="font-size:10px;color:#718096">${formatDateTime(m.fechaMovimiento)}</td>
      <td><span class="doc-badge" style="background:${isIngreso ? '#c6f6d5' : isAjuste ? '#e9d8fd' : '#fed7d7'};color:${isIngreso ? '#22543d' : isAjuste ? '#553c9a' : '#9b2c2c'}">${m.tipo.replace(/_/g, ' ')}</span></td>
      <td>${m.account?.nombre || '—'}</td>
      <td>${m.concepto || '—'}</td>
      <td class="text-right" style="color:${isIngreso ? '#22543d' : '#9b2c2c'}">${isIngreso ? '+' : '-'}${formatCurrency(m.monto)}</td>
      <td class="text-right" style="color:#718096">${formatCurrency(m.saldoAnterior)}</td>
      <td class="text-right" style="font-weight:700">${formatCurrency(m.saldoPosterior)}</td>
      <td style="font-size:10px;color:#718096">${m.user?.nombres || m.user?.nombre || m.user?.email || '—'}</td>
    </tr>`;
  }).join('');

  const filterLabel = params ? Object.entries(params).filter(([k]) => k !== 'limit').map(([k, v]) => `${k}: ${v}`).join(', ') : '';

  openPrintWindow('Movimientos Financieros', `
    ${getHeader(config)}
    <div class="doc-title">
      <h2>Libro de Movimientos Financieros</h2>
      <div class="doc-ref">${movements.length} registro(s) &mdash; ${new Date().toLocaleDateString('es-MX')}</div>
    </div>

    <div class="info-row">
      <div class="info-item"><div class="label">Total Ingresos</div><div class="value" style="color:#22543d">+${formatCurrency(totalIngresos)}</div></div>
      <div class="info-item"><div class="label">Total Egresos</div><div class="value" style="color:#9b2c2c">-${formatCurrency(totalEgresos)}</div></div>
      <div class="info-item"><div class="label">Ajustes</div><div class="value">${formatCurrency(totalAjustes)}</div></div>
      <div class="info-item"><div class="label">Movimientos</div><div class="value">${movements.length}</div></div>
    </div>

    ${filterLabel ? `<div style="font-size:9px;color:#718096;margin-bottom:10px;padding:4px 14px">Filtros aplicados: ${filterLabel}</div>` : ''}

    <table class="compact-table">
      <thead>
        <tr><th>Fecha</th><th>Tipo</th><th>Cuenta</th><th>Concepto</th><th class="text-right">Monto</th><th class="text-right">Saldo Anterior</th><th class="text-right">Saldo Posterior</th><th>Usuario</th></tr>
      </thead>
      <tbody>
        ${movRows || '<tr><td colspan="8" class="text-center" style="color:#a0aec0">Sin movimientos registrados</td></tr>'}
      </tbody>
    </table>

    <div class="signatures">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Elaborado por</div>
        <div class="sig-name">________________</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Revisado por</div>
        <div class="sig-name">________________</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Autorizado por</div>
        <div class="sig-name">________________</div>
      </div>
    </div>
  `);
}

export async function printCashClose(register: any) {
  if (!register?.id) return;
  const [movModule, configModule] = await Promise.all([
    import('@/api/cash-register.api'),
    import('@/api/hotel-config.api'),
  ]);
  const [data, config] = await Promise.all([
    movModule.cashRegisterApi.findMovements(register.id),
    configModule.hotelConfigApi.getConfig(),
  ]);
  const reg = data?.register || register;
  const movements = data?.movements?.data || [];

  const totalIngresos = movements
    .filter((m: any) => ['INGRESO', 'TRANSFERENCIA_ENTRADA', 'APERTURA_CAJA'].includes(m.tipo))
    .reduce((s: number, m: any) => s + Number(m.monto), 0);
  const totalEgresos = movements
    .filter((m: any) => ['EGRESO', 'TRANSFERENCIA_SALIDA'].includes(m.tipo))
    .reduce((s: number, m: any) => s + Number(m.monto), 0);
  const expectedAmount = Number(reg.montoInicial) + totalIngresos - totalEgresos;
  const totalDeclarado = Number(reg.totalEfectivo) + Number(reg.totalTransferencia) + Number(reg.totalTarjeta) + Number(reg.totalOtros);
  const diff = Number(reg.diferencia) || 0;

  const movRows = movements.map((m: any) => {
    const isIngreso = ['INGRESO', 'TRANSFERENCIA_ENTRADA', 'APERTURA_CAJA'].includes(m.tipo);
    return `
    <tr>
      <td>${formatDateTime(m.fechaMovimiento)}</td>
      <td>${m.tipo.replace(/_/g, ' ')}</td>
      <td>${m.concepto || '—'}</td>
      <td class="text-right" style="${isIngreso ? 'color:#22543d' : 'color:#9b2c2c'}">${isIngreso ? '+' : '-'}${formatCurrency(m.monto)}</td>
      <td>${m.user?.nombres ? `${m.user.nombres} ${m.user.apellidos || ''}` : '—'}</td>
    </tr>`;
  }).join('');

  openPrintWindow(`Cierre ${formatDateTime(reg.fechaApertura)}`, `
    ${getHeader(config)}
    <div class="doc-title">
      <h2>Reporte de Cierre de Caja</h2>
      <div class="doc-ref">${formatDateTime(reg.fechaApertura)} ${reg.fechaCierre ? `— ${formatDateTime(reg.fechaCierre)}` : ''}</div>
    </div>

    <div class="info-row">
      <div class="info-item"><div class="label">Usuario</div><div class="value">${reg.user?.nombres || ''} ${reg.user?.apellidos || ''}</div></div>
      <div class="info-item"><div class="label">Apertura</div><div class="value">${formatDateTime(reg.fechaApertura)}</div></div>
      <div class="info-item"><div class="label">Cierre</div><div class="value">${reg.fechaCierre ? formatDateTime(reg.fechaCierre) : '—'}</div></div>
      <div class="info-item"><div class="label">Transacciones</div><div class="value">${reg.cantidadTransacciones || 0}</div></div>
    </div>

    <div class="section-title">Resumen financiero</div>
    <div class="summary-cards">
      <div class="summary-card initial"><div class="card-label">Inicial</div><div class="card-value">${formatCurrency(reg.montoInicial)}</div></div>
      <div class="summary-card positive"><div class="card-label">Ingresos</div><div class="card-value">+${formatCurrency(totalIngresos)}</div></div>
      <div class="summary-card negative"><div class="card-label">Egresos</div><div class="card-value">-${formatCurrency(totalEgresos)}</div></div>
      <div class="summary-card total"><div class="card-label">Esperado</div><div class="card-value">${formatCurrency(expectedAmount)}</div></div>
      <div class="summary-card" style="background:#fffbeb;border-color:#f6e05e"><div class="card-label" style="color:#975a16">Declarado</div><div class="card-value" style="color:#744210">${formatCurrency(totalDeclarado)}</div></div>
    </div>

    <div class="amount-box" style="border-color:${diff !== 0 ? '#e53e3e' : '#38a169'};padding:5px 10px">
      <div class="amount-label">Diferencia</div>
      <div class="amount-value" style="font-size:14px;color:${diff !== 0 ? '#e53e3e' : '#38a169'}">${formatCurrency(diff)}</div>
    </div>

    <div class="section-title">Declaración por método de pago</div>
    <div style="display:flex;gap:6px;margin-bottom:6px">
      <table class="compact-table" style="margin:0">
        <tr><td style="color:#888">Efectivo</td><td class="text-right" style="font-weight:600">${formatCurrency(reg.totalEfectivo)}</td></tr>
        <tr><td style="color:#888">Transferencia</td><td class="text-right" style="font-weight:600">${formatCurrency(reg.totalTransferencia)}</td></tr>
        <tr><td style="color:#888">Tarjeta</td><td class="text-right" style="font-weight:600">${formatCurrency(reg.totalTarjeta)}</td></tr>
        <tr><td style="color:#888">Otros</td><td class="text-right" style="font-weight:600">${formatCurrency(reg.totalOtros)}</td></tr>
      </table>
      <table class="compact-table" style="margin:0">
        <tr><td style="color:#888">Ventas (sistema)</td><td class="text-right" style="font-weight:600">${formatCurrency(reg.totalVentas)}</td></tr>
        <tr><td style="color:#888">Transacciones</td><td class="text-right" style="font-weight:600">${reg.cantidadTransacciones || 0}</td></tr>
        <tr><td style="font-weight:700">Diferencia</td><td class="text-right" style="font-weight:800;color:${diff !== 0 ? '#e53e3e' : '#38a169'}">${formatCurrency(diff)}</td></tr>
      </table>
    </div>

    ${reg.observaciones ? `
    <div class="obs-box">
      <div class="obs-label">Observaciones</div>
      <div class="obs-text">${reg.observaciones}</div>
    </div>` : ''}

    <div class="section-title">Movimientos del turno</div>
    <table class="compact-table">
      <thead>
        <tr><th>Fecha</th><th>Tipo</th><th>Concepto</th><th class="text-right">Monto</th><th>Usuario</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>${formatDateTime(reg.fechaApertura)}</td>
          <td><span style="background:#eee;padding:1px 4px;font-size:7px">APERTURA</span></td>
          <td>Apertura de turno${reg.observaciones ? ` - ${reg.observaciones}` : ''}</td>
          <td class="text-right" style="color:#22543d">+${formatCurrency(reg.montoInicial)}</td>
          <td>${reg.user?.nombres || ''} ${reg.user?.apellidos || ''}</td>
        </tr>
        ${movRows}
      </tbody>
    </table>

    <div class="signatures">
      <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Cajero</div><div class="sig-name">${reg.user?.nombres || ''} ${reg.user?.apellidos || ''}</div></div>
      <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Supervisor</div><div class="sig-name">________________</div></div>
      <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Contador</div><div class="sig-name">________________</div></div>
    </div>
  `);
}

export async function printReservation(id: string) {
  const [resModule, configModule] = await Promise.all([
    import('@/api/reservations.api'),
    import('@/api/hotel-config.api'),
  ]);
  const [reservation, config] = await Promise.all([
    resModule.reservationsApi.findOne(id),
    configModule.hotelConfigApi.getConfig(),
  ]);

  const r = reservation;
  const noches = Math.max(1, Math.ceil(
    (new Date(r.fechaSalida).getTime() - new Date(r.fechaEntrada).getTime()) / (1000 * 60 * 60 * 24),
  ));
  const precioPorNoche = Number(r.room?.roomType?.precioBase || 0);
  const totalHabitacion = noches * precioPorNoche;
  const totalConsumos = (r.consumptions || []).reduce((sum: number, c: any) => sum + Number(c.subtotal), 0);
  const totalPedidos = (r.orders || []).reduce((sum: number, o: any) => sum + Number(o.total), 0);
  const totalEstancia = totalHabitacion + totalConsumos + totalPedidos;

  const statusLabels: Record<string, string> = {
    pendiente: 'Pendiente', confirmada: 'Confirmada', checkin: 'Check-In', checkout: 'Check-Out', cancelada: 'Cancelada',
  };

  const consumosHtml = (r.consumptions || []).map((c: any) => `
    <tr>
      <td>${c.inventoryItem?.nombre || '—'}</td>
      <td class="text-center">${c.cantidad}</td>
      <td class="text-right">${formatCurrency(c.precioUnitario)}</td>
      <td class="text-right">${formatCurrency(c.subtotal)}</td>
    </tr>`).join('');

  const pedidosHtml = (r.orders || []).map((o: any) => `
    <tr>
      <td><strong>${o.codigo}</strong></td>
      <td>${(o.items || []).map((i: any) => `${i.cantidad}x ${i.inventoryItem?.nombre || '—'}`).join(', ')}</td>
      <td class="text-center">${o.estado}</td>
      <td class="text-right">${formatCurrency(o.total)}</td>
    </tr>`).join('');

  const recibosHtml = (r.recibosCaja || []).map((rc: any) => `
    <tr>
      <td><strong>${rc.codigo}</strong></td>
      <td>${rc.fecha}</td>
      <td class="text-right">${formatCurrency(rc.total)}</td>
    </tr>`).join('');

  const entryDate = r.fechaEntrada ? new Date(r.fechaEntrada).toLocaleDateString('es-MX') : '—';
  const exitDate = r.fechaSalida ? new Date(r.fechaSalida).toLocaleDateString('es-MX') : '—';

  openPrintWindow(`Reserva ${r.codigo}`, `
    ${getHeader(config)}
    <div class="doc-title">
      <h2>Reserva de Habitaci\u00f3n</h2>
      <div class="doc-ref">N\u00b0 <strong>${r.codigo}</strong> &mdash; ${statusLabels[r.estado] || r.estado}</div>
    </div>

    <div class="info-row">
      <div><div class="label">Hu\u00e9sped</div><div class="value">${r.guest?.nombres || ''} ${r.guest?.apellidos || ''}</div></div>
      <div><div class="label">Documento</div><div class="value">${r.guest?.documento || '—'}</div></div>
      <div><div class="label">Tel\u00e9fono</div><div class="value">${r.guest?.telefono || '—'}</div></div>
    </div>

    <div class="field-row">
      <div class="field"><div class="field-label">Habitaci\u00f3n</div><div class="field-value">${r.room?.nombre || '—'} (${r.room?.roomType?.nombre || '—'})</div></div>
      <div class="field"><div class="field-label">Origen</div><div class="field-value" style="text-transform:capitalize">${r.origen || '—'}</div></div>
      <div class="field"><div class="field-label">Hu\u00e9spedes</div><div class="field-value">${r.cantidadHuespedes || 1}</div></div>
      <div class="field"><div class="field-label">Entrada</div><div class="field-value">${entryDate}</div></div>
      <div class="field"><div class="field-label">Salida</div><div class="field-value">${exitDate}</div></div>
      <div class="field"><div class="field-label">Noches</div><div class="field-value">${noches}</div></div>
    </div>

    ${r.companions?.length ? `
    <div class="section-title">Acompa\u00f1antes</div>
    <table class="compact-table">
      <thead><tr><th>Nombre</th><th>Documento</th><th>Tel\u00e9fono</th></tr></thead>
      <tbody>
        ${r.companions.map((c: any) => `<tr><td>${c.nombres} ${c.apellidos}</td><td>${c.documento || '—'}</td><td>${c.telefono || '—'}</td></tr>`).join('')}
      </tbody>
    </table>` : ''}

    <div class="section-title">Detalle de cargos</div>
    <table class="doc-table">
      <thead>
        <tr><th style="width:40%">Concepto</th><th style="width:15%" class="text-center">Detalle</th><th style="width:20%" class="text-right">Precio</th><th style="width:25%" class="text-right">Total</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>Alojamiento</td>
          <td class="text-center">${noches} noche${noches !== 1 ? 's' : ''}</td>
          <td class="text-right">${formatCurrency(precioPorNoche)} /noche</td>
          <td class="text-right">${formatCurrency(totalHabitacion)}</td>
        </tr>
      </tbody>
    </table>

    ${consumosHtml ? `
    <div class="section-title">Consumos</div>
    <table class="compact-table">
      <thead><tr><th>Producto</th><th class="text-center">Cant.</th><th class="text-right">P. Unit.</th><th class="text-right">Subtotal</th></tr></thead>
      <tbody>${consumosHtml}</tbody>
    </table>` : ''}

    ${pedidosHtml ? `
    <div class="section-title">Pedidos</div>
    <table class="compact-table">
      <thead><tr><th>C\u00f3digo</th><th>Items</th><th class="text-center">Estado</th><th class="text-right">Total</th></tr></thead>
      <tbody>${pedidosHtml}</tbody>
    </table>` : ''}

    <div class="totals-box">
      <table>
        <tr><td class="total-label">Habitaci\u00f3n</td><td class="total-value">${formatCurrency(totalHabitacion)}</td></tr>
        <tr><td class="total-label">Consumos</td><td class="total-value">${formatCurrency(totalConsumos)}</td></tr>
        <tr><td class="total-label">Pedidos</td><td class="total-value">${formatCurrency(totalPedidos)}</td></tr>
        <tr class="grand-total-row"><td>TOTAL ESTAD\u00cdA</td><td>${formatCurrency(totalEstancia)}</td></tr>
      </table>
    </div>

    ${recibosHtml ? `
    <div class="section-title">Recibos de Caja</div>
    <table class="compact-table">
      <thead><tr><th>C\u00f3digo</th><th>Fecha</th><th class="text-right">Total</th></tr></thead>
      <tbody>${recibosHtml}</tbody>
    </table>` : ''}

    ${r.checkIn ? `
    <div class="section-title">Check-In / Check-Out</div>
    <div style="display:flex;gap:14px;padding:5px 10px;background:#f5f5f5;margin-bottom:6px">
      <div><span style="font-size:7px;color:#888;text-transform:uppercase">Check-In</span><br><span style="font-size:9px;font-weight:600">${new Date(r.checkIn.fechaHora).toLocaleString('es-MX')}</span></div>
      <div><span style="font-size:7px;color:#888;text-transform:uppercase">Por</span><br><span style="font-size:9px;font-weight:600">${r.checkIn?.user?.nombres || r.checkIn?.user?.email || '—'}</span></div>
      ${r.checkOut ? `<div><span style="font-size:7px;color:#888;text-transform:uppercase">Check-Out</span><br><span style="font-size:9px;font-weight:600">${new Date(r.checkOut.fechaHora).toLocaleString('es-MX')}</span></div>
      <div><span style="font-size:7px;color:#888;text-transform:uppercase">Por</span><br><span style="font-size:9px;font-weight:600">${r.checkOut?.user?.nombres || r.checkOut?.user?.email || '—'}</span></div>` : ''}
    </div>` : ''}

    ${r.contratoFile ? `
    <div class="obs-box" style="border-left-color:#3182ce">
      <div class="obs-label">Contrato</div>
      <div class="obs-text">${r.contratoFile.originalName}</div>
    </div>` : ''}

    ${r.observaciones ? `
    <div class="obs-box">
      <div class="obs-label">Observaciones</div>
      <div class="obs-text">${r.observaciones}</div>
    </div>` : ''}

    <div class="signatures">
      <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Hu\u00e9sped</div><div class="sig-name">${r.guest?.nombres || ''} ${r.guest?.apellidos || ''}</div></div>
      <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Recibido por</div><div class="sig-name">________________</div></div>
      <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Autorizado por</div><div class="sig-name">________________</div></div>
    </div>
  `);
}