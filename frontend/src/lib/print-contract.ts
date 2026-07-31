export interface ContractData {
  guest: {
    nombres: string;
    apellidos: string;
    documento: string;
    nacionalidad: string;
    telefono?: string;
    email?: string;
  };
  room: {
    numero: string;
    nombre: string;
    tipoHabitacion: string;
    precioBase?: number;
  };
  hotel: {
    nombre: string;
    direccion: string;
    ciudad: string;
    pais: string;
    telefono: string;
    email: string;
    logo?: string;
  };
  fechaEntrada: string;
  fechaSalida: string;
  cantidadHuespedes: number;
  huespedesLista?: string;
  descuento?: number;
  registro?: {
    direccion?: string;
    ciudad?: string;
    pais?: string;
    oficio?: string;
    empresa?: string;
    telefonoContacto?: string;
    emailContacto?: string;
    transporteLlegada?: string;
    transporteSalida?: string;
    reservacionOrigen?: string;
    procedencia?: string;
    destino?: string;
    motivoViaje?: string;
    numeroPlaca?: string;
  };
}

export function generateDefaultContract(data: ContractData): string {
  const nights = Math.max(1, Math.round(
    (new Date(data.fechaSalida).getTime() - new Date(data.fechaEntrada).getTime()) / (1000 * 60 * 60 * 24)
  ));
  const totalEstimado = (data.room.precioBase || 0) * nights;
  const reg = data.registro || {};
  const fechaHoy = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  const fechaEntradaFmt = new Date(data.fechaEntrada).toLocaleDateString('es-ES');
  const fechaSalidaFmt = new Date(data.fechaSalida).toLocaleDateString('es-ES');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Contrato de Hospedaje - ${data.hotel.nombre}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #222; padding: 20px; line-height: 1.5; }
  .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
  .header h1 { font-size: 16px; text-transform: uppercase; letter-spacing: 1px; }
  .header p { font-size: 10px; color: #555; }
  .section-title { font-weight: bold; font-size: 11px; text-transform: uppercase; background: #f0f0f0; padding: 4px 8px; margin: 12px 0 6px; border-left: 3px solid #333; }
  .fields { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 16px; padding: 0 8px; }
  .field { display: flex; gap: 4px; }
  .field .label { font-weight: bold; white-space: nowrap; }
  .field .value { color: #444; }
  .full-width { grid-column: 1 / -1; }
  .summary { padding: 0 8px; margin: 10px 0; }
  .summary table { width: 100%; border-collapse: collapse; }
  .summary th, .summary td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; font-size: 10px; }
  .summary th { background: #f5f5f5; }
  .text-block { padding: 0 8px; font-size: 10px; text-align: justify; margin: 8px 0; }
  .signature-section { margin-top: 40px; display: flex; justify-content: space-around; padding: 0 40px; }
  .signature-box { text-align: center; width: 200px; }
  .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; font-size: 10px; }
  @media print { body { padding: 10px; } }
</style>
</head>
<body>

<div class="header">
  <h1>Contrato de Hospedaje</h1>
  <p>${data.hotel.nombre} | ${data.hotel.direccion}, ${data.hotel.ciudad}, ${data.hotel.pais}</p>
  <p>Tel: ${data.hotel.telefono} | Email: ${data.hotel.email}</p>
</div>

<div class="section-title">Datos del Huésped</div>
<div class="fields">
  <div class="field"><span class="label">Nombres:</span><span class="value">${data.guest.nombres}</span></div>
  <div class="field"><span class="label">Apellidos:</span><span class="value">${data.guest.apellidos}</span></div>
  <div class="field"><span class="label">Documento:</span><span class="value">${data.guest.documento}</span></div>
  <div class="field"><span class="label">Nacionalidad:</span><span class="value">${data.guest.nacionalidad}</span></div>
  <div class="field"><span class="label">Teléfono:</span><span class="value">${reg.telefonoContacto || data.guest.telefono || '---'}</span></div>
  <div class="field"><span class="label">Email:</span><span class="value">${reg.emailContacto || data.guest.email || '---'}</span></div>
  <div class="field"><span class="label">Dirección:</span><span class="value">${reg.direccion || '---'}</span></div>
  <div class="field"><span class="label">Ciudad / País:</span><span class="value">${reg.ciudad || '---'} / ${reg.pais || '---'}</span></div>
  <div class="field"><span class="label">Oficio / Ocupación:</span><span class="value">${reg.oficio || '---'}</span></div>
  <div class="field"><span class="label">Empresa:</span><span class="value">${reg.empresa || '---'}</span></div>
</div>

<div class="section-title">Registro Hotelero</div>
<div class="fields">
  <div class="field"><span class="label">Transporte de llegada:</span><span class="value">${reg.transporteLlegada || '---'}</span></div>
  <div class="field"><span class="label">Transporte de salida:</span><span class="value">${reg.transporteSalida || '---'}</span></div>
  <div class="field"><span class="label">Reservación origen:</span><span class="value">${reg.reservacionOrigen || '---'}</span></div>
  <div class="field"><span class="label">Procedencia:</span><span class="value">${reg.procedencia || '---'}</span></div>
  <div class="field"><span class="label">Destino:</span><span class="value">${reg.destino || '---'}</span></div>
  <div class="field"><span class="label">Motivo de viaje:</span><span class="value">${reg.motivoViaje || '---'}</span></div>
  <div class="field"><span class="label">Número de placa:</span><span class="value">${reg.numeroPlaca || '---'}</span></div>
</div>

<div class="section-title">Detalles de la Reservación</div>
<div class="fields">
  <div class="field"><span class="label">Habitación:</span><span class="value">${data.room.numero} — ${data.room.nombre}</span></div>
  <div class="field"><span class="label">Tipo:</span><span class="value">${data.room.tipoHabitacion}</span></div>
  <div class="field"><span class="label">Fecha de entrada:</span><span class="value">${fechaEntradaFmt}</span></div>
  <div class="field"><span class="label">Fecha de salida:</span><span class="value">${fechaSalidaFmt}</span></div>
  <div class="field"><span class="label">Noches:</span><span class="value">${nights}</span></div>
  <div class="field"><span class="label">Huéspedes:</span><span class="value">${data.cantidadHuespedes}</span></div>
  ${data.huespedesLista ? `<div class="field full-width"><span class="label">Acompañantes:</span><span class="value">${data.huespedesLista}</span></div>` : ''}
  <div class="field"><span class="label">Total estimado:</span><span class="value">$${totalEstimado?.toFixed(2)}</span></div>
  ${data.descuento ? `<div class="field"><span class="label">Descuento:</span><span class="value">-$${Number(data.descuento).toFixed(2)}</span></div>
  <div class="field"><span class="label">Total con descuento:</span><span class="value">$${Math.max(0, totalEstimado - Number(data.descuento)).toFixed(2)}</span></div>` : ''}
</div>

<div class="section-title">Condiciones</div>
<div class="text-block">
  <p><strong>1.</strong> El huésped se compromete a respetar las normas de convivencia del hotel.</p>
  <p><strong>2.</strong> El horario de check-out es a las 1:00 p.m. El check-in se realiza a partir de las 3:00 p.m.</p>
  <p><strong>3.</strong> No se permiten mascotas en las habitaciones.</p>
  <p><strong>4.</strong> El hotel no se hace responsable por objetos de valor dejados en la habitación.</p>
  <p><strong>5.</strong> Cualquier daño a las instalaciones será cobrado al huésped.</p>
  <p><strong>6.</strong> La cancelación debe realizarse con al menos 24 horas de anticipación.</p>
</div>

<div class="signature-section">
  <div class="signature-box">
    <div class="signature-line">Firma del Huésped</div>
  </div>
  <div class="signature-box">
    <div class="signature-line">Representante del Hotel</div>
  </div>
</div>

<p style="text-align:center; font-size:9px; color:#999; margin-top:20px;">Fecha de generación: ${fechaHoy}</p>

</body>
</html>`;
}

export function renderContract(html: string, data: ContractData): string {
  const nights = Math.max(1, Math.round(
    (new Date(data.fechaSalida).getTime() - new Date(data.fechaEntrada).getTime()) / (1000 * 60 * 60 * 24)
  ));
  const totalEstimado = (data.room.precioBase || 0) * nights;
  const reg = data.registro || {};

  const replacements: Record<string, string> = {
    '{{nombre}}': data.guest.nombres,
    '{{apellidos}}': data.guest.apellidos,
    '{{documento}}': data.guest.documento,
    '{{nacionalidad}}': data.guest.nacionalidad,
    '{{telefono}}': reg.telefonoContacto || data.guest.telefono || '',
    '{{email}}': reg.emailContacto || data.guest.email || '',
    '{{habitacion}}': `${data.room.numero} — ${data.room.nombre}`,
    '{{tipo_habitacion}}': data.room.tipoHabitacion,
    '{{fecha_entrada}}': data.fechaEntrada,
    '{{fecha_salida}}': data.fechaSalida,
    '{{hotel_nombre}}': data.hotel.nombre,
    '{{hotel_direccion}}': data.hotel.direccion,
    '{{hotel_ciudad}}': data.hotel.ciudad,
    '{{hotel_pais}}': data.hotel.pais,
    '{{hotel_telefono}}': data.hotel.telefono,
    '{{hotel_email}}': data.hotel.email,
    '{{fecha_hoy}}': new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
    '{{cantidad_huespedes}}': String(data.cantidadHuespedes),
    '{{huespedes_lista}}': data.huespedesLista || '',
    '{{noches}}': String(nights),
    '{{precio_noche}}': data.room.precioBase ? `$${data.room.precioBase}` : '',
    '{{total_estimado}}': `$${totalEstimado.toFixed(2)}`,
    '{{descuento}}': data.descuento ? `-$${Number(data.descuento).toFixed(2)}` : '',
    '{{total_con_descuento}}': data.descuento ? `$${Math.max(0, totalEstimado - Number(data.descuento)).toFixed(2)}` : `$${totalEstimado.toFixed(2)}`,
    '{{direccion}}': reg.direccion || '',
    '{{ciudad}}': reg.ciudad || '',
    '{{pais}}': reg.pais || '',
    '{{oficio}}': reg.oficio || '',
    '{{empresa}}': reg.empresa || '',
    '{{telefono_contacto}}': reg.telefonoContacto || '',
    '{{email_contacto}}': reg.emailContacto || '',
    '{{transporte_llegada}}': reg.transporteLlegada || '',
    '{{transporte_salida}}': reg.transporteSalida || '',
    '{{reservacion_origen}}': reg.reservacionOrigen || '',
    '{{procedencia}}': reg.procedencia || '',
    '{{destino}}': reg.destino || '',
    '{{motivo_viaje}}': reg.motivoViaje || '',
    '{{numero_placa}}': reg.numeroPlaca || '',
  };

  let result = html;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.split(key).join(value);
  }

  return result;
}

export function printContract(htmlContent: string): void {
  const win = window.open('', 'contrato', 'width=900,height=700,left=100,top=100');
  if (!win) { alert('Permite ventanas emergentes para imprimir el contrato'); return; }
  win.document.write(htmlContent);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}
