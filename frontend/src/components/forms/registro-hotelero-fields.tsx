import { Input } from '@/components/ui/input';

interface GuestDefault {
  nombres?: string;
  apellidos?: string;
  documento?: string;
  tipoIdentificacion?: string;
  telefono?: string;
}

interface RegistroHoteleroFieldsProps {
  data: Record<string, string>;
  onChange: (field: string, value: string) => void;
  guestDefault?: GuestDefault | null;
}

export function RegistroHoteleroFields({ data, onChange, guestDefault }: RegistroHoteleroFieldsProps) {
  const holderName = [guestDefault?.nombres, guestDefault?.apellidos].filter(Boolean).join(' ') || '—';

  const guestValue = (field: keyof GuestDefault, fallback = '') => {
    const key = field === 'telefono' ? 'huespedCelular' : field === 'nombres' ? 'huespedNombres' : field === 'apellidos' ? 'huespedApellidos' : field === 'documento' ? 'huespedDocumento' : 'tipoIdentificacion';
    return data[key] ?? guestDefault?.[field] ?? fallback;
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Datos del Huésped</p>
        <p className="text-xs text-muted-foreground">
          Huésped de la reserva: <span className="font-medium text-foreground">{holderName}</span>
          <span className="ml-1">(puedes modificar los datos si el huésped es otro)</span>
        </p>
      </div>

      <div className="rounded-lg border p-3 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Nombre</label>
            <Input
              placeholder="Nombre"
              value={guestValue('nombres')}
              onChange={(e) => onChange('huespedNombres', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Apellido</label>
            <Input
              placeholder="Apellido"
              value={guestValue('apellidos')}
              onChange={(e) => onChange('huespedApellidos', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Cédula</label>
            <div className="flex gap-2">
              <Input
                className="flex-1"
                placeholder="Cédula / Pasaporte"
                value={guestValue('documento')}
                onChange={(e) => onChange('huespedDocumento', e.target.value)}
              />
              <select
                className="w-24 rounded-md border border-input bg-transparent px-2 py-2 text-sm"
                value={guestValue('tipoIdentificacion', 'CC')}
                onChange={(e) => onChange('tipoIdentificacion', e.target.value)}
              >
                <option value="CC">CC</option>
                <option value="C.E">C.E</option>
                <option value="P.E.P">P.E.P</option>
                <option value="D.N.I">D.N.I</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Celular</label>
            <Input
              placeholder="Celular"
              value={guestValue('telefono')}
              onChange={(e) => onChange('huespedCelular', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Dirección</label>
          <Input placeholder="Dirección" value={data.direccion || ''} onChange={(e) => onChange('direccion', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Ciudad</label>
          <Input placeholder="Ciudad" value={data.ciudad || ''} onChange={(e) => onChange('ciudad', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">País</label>
          <Input placeholder="País" value={data.pais || ''} onChange={(e) => onChange('pais', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Oficio / Ocupación</label>
          <Input placeholder="Ej: Ingeniero" value={data.oficio || ''} onChange={(e) => onChange('oficio', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Empresa</label>
          <Input placeholder="Empresa" value={data.empresa || ''} onChange={(e) => onChange('empresa', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Teléfono</label>
          <Input placeholder="Teléfono" value={data.telefonoContacto || ''} onChange={(e) => onChange('telefonoContacto', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Email</label>
          <Input placeholder="Email" value={data.emailContacto || ''} onChange={(e) => onChange('emailContacto', e.target.value)} />
        </div>
      </div>

      <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide pt-2">Registro Hotelero</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Transporte de llegada</label>
          <Input placeholder="Ej: Vehículo propio, Taxi, Bus" value={data.transporteLlegada || ''} onChange={(e) => onChange('transporteLlegada', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Transporte de salida</label>
          <Input placeholder="Ej: Vehículo propio, Taxi, Bus" value={data.transporteSalida || ''} onChange={(e) => onChange('transporteSalida', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Reservación origen</label>
          <Input placeholder="Ej: Directo, Booking, Airbnb" value={data.reservacionOrigen || ''} onChange={(e) => onChange('reservacionOrigen', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Procedencia</label>
          <Input placeholder="Ciudad de procedencia" value={data.procedencia || ''} onChange={(e) => onChange('procedencia', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Destino</label>
          <Input placeholder="Ciudad de destino" value={data.destino || ''} onChange={(e) => onChange('destino', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Motivo de viaje</label>
          <Input placeholder="Ej: Negocios, Turismo" value={data.motivoViaje || ''} onChange={(e) => onChange('motivoViaje', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Tipo de acomodación</label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={data.tipoAcomodacion || 'multiple'}
            onChange={(e) => onChange('tipoAcomodacion', e.target.value)}
          >
            <option value="individual">Individual</option>
            <option value="multiple">Múltiple</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Número de placa</label>
          <Input placeholder="Placa del vehículo" value={data.numeroPlaca || ''} onChange={(e) => onChange('numeroPlaca', e.target.value)} />
        </div>
      </div>
    </div>
  );
}
