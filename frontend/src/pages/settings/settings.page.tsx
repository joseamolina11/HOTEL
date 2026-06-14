import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelConfigApi } from '@/api/hotel-config.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, Building2, Loader2, Upload, ImageIcon } from 'lucide-react';
import { toastSuccess } from '@/lib/notifications';

export function SettingsPage() {
  const { data: config, isLoading } = useQuery({
    queryKey: ['hotel-config'],
    queryFn: () => hotelConfigApi.getConfig(),
  });

  const { register, handleSubmit, reset } = useForm({
    values: config,
  });

  useEffect(() => {
    if (config) reset(config);
  }, [config, reset]);

  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (dto: any) => hotelConfigApi.updateConfig(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hotel-config'] }); toastSuccess('Configuración guardada'); },
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const logoMutation = useMutation({
    mutationFn: (file: File) => hotelConfigApi.uploadLogo(file),
    onSuccess: (res) => {
      setLogoPreview(null);
      qc.invalidateQueries({ queryKey: ['hotel-config'] });
      toastSuccess('Logo actualizado');
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
    logoMutation.mutate(file);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Configuración</h1>
        <Card><CardContent className="h-64 animate-pulse bg-muted rounded-xl" /></Card>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
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
                <Input {...register('nombre')} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Dirección</label>
                <Input {...register('direccion')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ciudad</label>
                  <Input {...register('ciudad')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">País</label>
                  <Input {...register('pais')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Teléfono</label>
                  <Input {...register('telefono')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input {...register('email')} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Moneda</label>
                <Input {...register('moneda')} />
              </div>
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" /> Guardar Cambios</>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium">Horarios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hora de Check-In</label>
                  <Input type="time" {...register('checkInTime')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hora de Check-Out</label>
                  <Input type="time" {...register('checkOutTime')} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <ImageIcon className="h-4 w-4" /> Logo del Hotel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(config?.logo || logoPreview) && (
                  <div className="flex justify-center">
                    <img
                      src={logoPreview || (import.meta.env.VITE_API_URL_BACKEND + config?.logo)}
                      alt="Logo"
                      className="h-24 w-auto object-contain rounded border"
                    />
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={logoMutation.isPending}
                  onClick={() => fileRef.current?.click()}
                >
                  {logoMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo...</>
                  ) : (
                    <><Upload className="mr-2 h-4 w-4" /> {config?.logo ? 'Cambiar Logo' : 'Subir Logo'}</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </form>
  );
}
