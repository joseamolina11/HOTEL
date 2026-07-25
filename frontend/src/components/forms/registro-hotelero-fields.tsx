import { Input } from '@/components/ui/input';

interface RegistroHoteleroFieldsProps {
  data: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export function RegistroHoteleroFields({ data, onChange }: RegistroHoteleroFieldsProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Datos del Huésped</p>
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
          <label className="text-xs text-muted-foreground">Número de placa</label>
          <Input placeholder="Placa del vehículo" value={data.numeroPlaca || ''} onChange={(e) => onChange('numeroPlaca', e.target.value)} />
        </div>
      </div>
    </div>
  );
}
