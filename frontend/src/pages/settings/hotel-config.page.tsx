import { useQuery } from '@tanstack/react-query';
import { hotelConfigApi } from '@/api/hotel-config.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, Building2, Phone, Mail, MapPin, Clock } from 'lucide-react';

export function SettingsPage() {
  const { data: config, isLoading } = useQuery({
    queryKey: ['hotel-config'],
    queryFn: () => hotelConfigApi.getConfig(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Configuración</h1>
        <Card><CardContent className="h-64 animate-pulse bg-muted rounded-xl" /></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configuración</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4" /> Información del Hotel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre del Hotel</label>
              <Input defaultValue={config?.nombre} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Dirección</label>
              <Input defaultValue={config?.direccion} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ciudad</label>
                <Input defaultValue={config?.ciudad} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">País</label>
                <Input defaultValue={config?.pais} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Teléfono</label>
                <Input defaultValue={config?.telefono} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input defaultValue={config?.email} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Moneda</label>
              <Input defaultValue={config?.moneda} />
            </div>
            <Button className="w-full">
              <Save className="mr-2 h-4 w-4" /> Guardar Cambios
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" /> Horarios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Hora de Check-In</label>
              <Input type="time" defaultValue={config?.checkInTime} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Hora de Check-Out</label>
              <Input type="time" defaultValue={config?.checkOutTime} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
