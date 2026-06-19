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
}

export function renderContract(html: string, data: ContractData): string {
  const nights = Math.max(1, Math.round(
    (new Date(data.fechaSalida).getTime() - new Date(data.fechaEntrada).getTime()) / (1000 * 60 * 60 * 24)
  ));
  const totalEstimado = (data.room.precioBase || 0) * nights;

  const replacements: Record<string, string> = {
    '{{nombre}}': data.guest.nombres,
    '{{apellidos}}': data.guest.apellidos,
    '{{documento}}': data.guest.documento,
    '{{nacionalidad}}': data.guest.nacionalidad,
    '{{telefono}}': data.guest.telefono || '',
    '{{email}}': data.guest.email || '',
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
  };

  let result = html;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.split(key).join(value);
  }

  return result;
}

export function printContract(htmlContent: string): void {
  const win = window.open('', '_blank');
  if (!win) { alert('Permite ventanas emergentes para imprimir el contrato'); return; }
  win.document.write(htmlContent);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}
